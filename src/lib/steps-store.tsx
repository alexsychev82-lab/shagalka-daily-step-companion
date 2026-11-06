import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type Settings = {
  goal: number;
  heightCm: number | null;
  weightKg: number | null;
  haptics: boolean;
  demo: boolean;
  onboarded: boolean;
};
export type DayData = { real: number[]; demo: number[]; celebrated?: boolean; gpsKm?: number };
type Persisted = { settings: Settings; days: Record<string, DayData> };

const KEY = "alexstep:v1";
const HISTORY_DAYS = 30;
export const DEFAULT_SETTINGS: Settings = { goal: 8000, heightCm: null, weightKg: null, haptics: true, demo: false, onboarded: false };

export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const emptyDay = (): DayData => ({ real: Array(24).fill(0), demo: Array(24).fill(0) });

export const clampInt = (v: unknown, min: number, max: number, fb: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fb;
};

function sanitizeDay(d: unknown): DayData {
  const o = (d ?? {}) as Partial<DayData>;
  const arr = (a: unknown) => Array.from({ length: 24 }, (_, i) => clampInt(Array.isArray(a) ? a[i] : 0, 0, 100000, 0));
  return { real: arr(o.real), demo: arr(o.demo), celebrated: !!o.celebrated, gpsKm: Math.max(0, Number(o.gpsKm) || 0) };
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { settings: DEFAULT_SETTINGS, days: {} };
    const p = JSON.parse(raw) as Partial<Persisted>;
    const s = { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) };
    const settings: Settings = {
      goal: clampInt(s.goal, 500, 100000, 8000),
      heightCm: s.heightCm == null ? null : clampInt(s.heightCm, 100, 250, 175),
      weightKg: s.weightKg == null ? null : clampInt(s.weightKg, 30, 300, 70),
      haptics: !!s.haptics, demo: !!s.demo, onboarded: !!s.onboarded,
    };
    const days: Record<string, DayData> = {};
    for (const [k, v] of Object.entries(p.days ?? {})) if (/^\d{4}-\d{2}-\d{2}$/.test(k)) days[k] = sanitizeDay(v);
    return { settings, days };
  } catch {
    return { settings: DEFAULT_SETTINGS, days: {} };
  }
}

function prune(days: Record<string, DayData>) {
  const keys = Object.keys(days).sort().slice(-HISTORY_DAYS);
  return Object.fromEntries(keys.map((k) => [k, days[k]]));
}

export const daySteps = (d: DayData | undefined, demo: boolean) => (d ? (demo ? d.demo : d.real).reduce((a, b) => a + b, 0) : 0);
export const strideM = (s: Settings) => (s.heightCm ? (s.heightCm * 0.415) / 100 : 0.75);
export const kmFor = (steps: number, s: Settings) => (steps * strideM(s)) / 1000;
export const kcalFor = (steps: number, s: Settings) => steps * (s.weightKg ?? 70) * 0.00057;

export type SensorState = "off" | "unsupported" | "requesting" | "denied" | "active";
export type GpsState = { status: "idle" | "requesting" | "active" | "denied" | "unavailable" | "error"; startedAt: number | null; meters: number; samples: number; accuracy: number | null; message?: string };

type Ctx = {
  ready: boolean; today: string; settings: Settings; days: Record<string, DayData>;
  todayData: DayData; steps: number;
  updateSettings: (p: Partial<Settings>) => void;
  addSteps: (n: number) => void;
  resetToday: () => void; resetDemo: () => void; resetAll: () => void;
  markCelebrated: () => void;
  sensor: SensorState; sensorMsg: string | null; startSensor: () => Promise<void>; stopSensor: () => void;
  gps: GpsState; startGps: () => void; stopGps: () => void;
  simulating: boolean; setSimulating: (b: boolean) => void;
};
const StepsContext = createContext<Ctx | null>(null);
export const useSteps = () => {
  const c = useContext(StepsContext);
  if (!c) throw new Error("useSteps outside provider");
  return c;
};

function haversine(a: GeolocationCoordinates, b: GeolocationCoordinates) {
  const R = 6371000, toR = (x: number) => (x * Math.PI) / 180;
  const dLat = toR(b.latitude - a.latitude), dLon = toR(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.latitude)) * Math.cos(toR(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function StepsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Persisted>({ settings: DEFAULT_SETTINGS, days: {} });
  const [today, setToday] = useState("");
  const [sensor, setSensor] = useState<SensorState>("off");
  const [sensorMsg, setSensorMsg] = useState<string | null>(null);
  const [gps, setGps] = useState<GpsState>({ status: "idle", startedAt: null, meters: 0, samples: 0, accuracy: null });
  const [simulating, setSimulating] = useState(false);
  const settingsRef = useRef(data.settings);
  settingsRef.current = data.settings;

  useEffect(() => {
    setData(load());
    setToday(dateKey());
    setReady(true);
    const t = setInterval(() => setToday((p) => (p === dateKey() ? p : dateKey())), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify({ ...data, days: prune(data.days) })); } catch { /* quota */ }
  }, [data, ready]);

  const mutateToday = useCallback((fn: (d: DayData) => DayData) => {
    setData((p) => {
      const k = dateKey();
      return { ...p, days: { ...p.days, [k]: fn(p.days[k] ? sanitizeDay(p.days[k]) : emptyDay()) } };
    });
  }, []);

  const addTo = useCallback((n: number, forceDemo?: boolean) => {
    const demo = forceDemo ?? settingsRef.current.demo;
    mutateToday((d) => {
      const field = demo ? "demo" : "real";
      const arr = [...d[field]];
      const h = new Date().getHours();
      if (n >= 0) arr[h] = (arr[h] ?? 0) + n;
      else {
        let rem = -n;
        for (let i = h; i >= 0 && rem > 0; i--) { const cur = arr[i] ?? 0; const take = Math.min(cur, rem); arr[i] = cur - take; rem -= take; }
      }
      return { ...d, [field]: arr };
    });
  }, [mutateToday]);

  const vibrate = () => {
    if (settingsRef.current.haptics && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(15);
  };

  // --- Motion sensor step detection ---
  const motionHandler = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const stopSensor = useCallback(() => {
    if (motionHandler.current) window.removeEventListener("devicemotion", motionHandler.current);
    motionHandler.current = null;
    setSensor("off");
  }, []);

  const startSensor = useCallback(async () => {
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
      setSensor("unsupported"); setSensorMsg("Этот браузер не даёт доступа к датчику движения."); return;
    }
    const DME = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DME.requestPermission === "function") {
      setSensor("requesting");
      try {
        if ((await DME.requestPermission()) !== "granted") { setSensor("denied"); setSensorMsg("Доступ к датчику движения отклонён."); return; }
      } catch { setSensor("denied"); setSensorMsg("Не удалось запросить доступ к датчику."); return; }
    }
    let smooth = 9.81, baseline = 9.81, above = false, peak = 0;
    let lastStep = 0; const pending: number[] = []; let confirmed = false; let gotEvent = false;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      gotEvent = true;
      const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      smooth = smooth * 0.75 + mag * 0.25; // low-pass
      baseline = baseline * 0.98 + smooth * 0.02; // slow gravity baseline
      const dev = smooth - baseline;
      const now = performance.now();
      if (!above && dev > 1.3) { above = true; peak = dev; }
      else if (above) {
        peak = Math.max(peak, dev);
        if (dev < 0.3) {
          above = false;
          const gap = now - lastStep;
          // human cadence ~0.3–2 s between steps; ignore strong shakes
          if (peak < 8 && gap > 300) {
            if (gap > 2000) { pending.length = 0; confirmed = false; }
            lastStep = now;
            if (confirmed) { addTo(1, false); }
            else {
              pending.push(now);
              if (pending.length >= 4) { confirmed = true; addTo(pending.length, false); pending.length = 0; vibrate(); }
            }
          }
        }
      }
    };
    motionHandler.current = handler;
    window.addEventListener("devicemotion", handler);
    setSensor("active"); setSensorMsg(null);
    setTimeout(() => {
      if (!gotEvent && motionHandler.current === handler) {
        setSensorMsg("Датчик не присылает данные. Возможно, браузер или устройство его не поддерживает (нужен HTTPS).");
      }
    }, 3000);
  }, [addTo]);

  // --- GPS ---
  const watchId = useRef<number | null>(null);
  const lastPos = useRef<GeolocationCoordinates | null>(null);
  const stopGps = useCallback(() => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null; lastPos.current = null;
    setGps((g) => {
      if (g.meters > 0) mutateToday((d) => ({ ...d, gpsKm: (d.gpsKm ?? 0) + g.meters / 1000 }));
      return { ...g, status: "idle", startedAt: null };
    });
  }, [mutateToday]);
  const startGps = useCallback(() => {
    if (!("geolocation" in navigator)) { setGps((g) => ({ ...g, status: "unavailable", message: "Геолокация недоступна в этом браузере." })); return; }
    setGps({ status: "requesting", startedAt: null, meters: 0, samples: 0, accuracy: null });
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        setGps((g) => {
          let add = 0;
          if (c.accuracy <= 50) {
            if (lastPos.current) { const d = haversine(lastPos.current, c); if (d >= 3 && d < 200) { add = d; lastPos.current = c; } }
            else lastPos.current = c;
          }
          return { status: "active", startedAt: g.startedAt ?? Date.now(), meters: g.meters + add, samples: g.samples + 1, accuracy: c.accuracy };
        });
      },
      (err) => {
        if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
        const map: Record<number, [GpsState["status"], string]> = {
          1: ["denied", "Доступ к геолокации запрещён. Разрешите его в настройках браузера."],
          2: ["unavailable", "Не удалось определить местоположение. Выйдите на открытое место."],
          3: ["error", "Превышено время ожидания GPS."],
        };
        const [status, message] = map[err.code] ?? ["error", "Ошибка GPS."];
        setGps((g) => ({ ...g, status, startedAt: null, message }));
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 },
    );
  }, []);

  useEffect(() => () => {
    if (motionHandler.current) window.removeEventListener("devicemotion", motionHandler.current);
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  // --- Demo simulation ---
  useEffect(() => {
    if (!simulating || !data.settings.demo) return;
    const t = setInterval(() => addTo(Math.floor(1 + Math.random() * 3), true), 1000);
    return () => clearInterval(t);
  }, [simulating, data.settings.demo, addTo]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((p) => {
      const settings = { ...p.settings, ...patch };
      let days = p.days;
      // when demo first enabled today, seed realistic sample hours so the chart isn't empty
      if (patch.demo && !p.settings.demo) {
        const k = dateKey(); const d = days[k] ? sanitizeDay(days[k]) : emptyDay();
        if (d.demo.every((v) => v === 0)) {
          const h = new Date().getHours();
          const demo = d.demo.map((_, i) => (i < 7 || i > h ? 0 : Math.round(150 + Math.random() * (i === 8 || i === 13 || i === 18 ? 1400 : 500))));
          days = { ...days, [k]: { ...d, demo } };
          // seed a few past demo days too
          for (let i = 1; i <= 6; i++) {
            const dt = new Date(); dt.setDate(dt.getDate() - i); const kk = dateKey(dt);
            const pd = days[kk] ? sanitizeDay(days[kk]) : emptyDay();
            if (pd.demo.every((v) => v === 0)) {
              days = { ...days, [kk]: { ...pd, demo: pd.demo.map((_, j) => (j < 7 || j > 21 ? 0 : Math.round(Math.random() * 900))) } };
            }
          }
        }
      }
      return { ...p, settings, days };
    });
    if (patch.demo === false) setSimulating(false);
  }, []);

  const todayData = (today && data.days[today]) || emptyDay();
  const value: Ctx = {
    ready, today, settings: data.settings, days: data.days, todayData,
    steps: daySteps(todayData, data.settings.demo),
    updateSettings, addSteps: (n) => addTo(n),
    resetToday: () => mutateToday((d) => ({ ...d, [settingsRef.current.demo ? "demo" : "real"]: Array(24).fill(0), celebrated: false })),
    resetDemo: () => { setSimulating(false); setData((p) => ({ ...p, days: Object.fromEntries(Object.entries(p.days).map(([k, d]) => [k, { ...d, demo: Array(24).fill(0) }])) })); },
    resetAll: () => { stopSensor(); stopGps(); setSimulating(false); setData({ settings: { ...DEFAULT_SETTINGS, onboarded: true }, days: {} }); },
    markCelebrated: () => mutateToday((d) => ({ ...d, celebrated: true })),
    sensor, sensorMsg, startSensor, stopSensor, gps, startGps, stopGps, simulating, setSimulating,
  };
  return <StepsContext.Provider value={value}>{children}</StepsContext.Provider>;
}
