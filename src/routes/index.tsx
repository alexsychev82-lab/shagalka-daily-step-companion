import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Flame, MapPin, Minus, Navigation, Pause, Play, Plus, Route as RouteIcon, Sparkles, Square, Trophy, X, Zap } from "lucide-react";
import { useSteps, kmFor, kcalFor, clampInt } from "@/lib/steps-store";
import { Btn, Card, fmt } from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Сегодня — Alex'step" },
      { name: "description", content: "Шаги за сегодня, прогресс к цели, дистанция, калории и GPS-прогулка." },
      { property: "og:title", content: "Сегодня — Alex'step" },
      { property: "og:description", content: "Шагомер Alex'step: прогресс к дневной цели и GPS-прогулки." },
    ],
  }),
  component: Today,
});

function status(pct: number) {
  if (pct >= 100) return "Цель достигнута — отличная работа!";
  if (pct >= 75) return "Финишная прямая, осталось чуть-чуть";
  if (pct >= 40) return "Хороший темп, продолжайте";
  if (pct > 0) return "Отличное начало дня";
  return "Самое время сделать первые шаги";
}

function Ring({ pct }: { pct: number }) {
  const r = 108, c = 2 * Math.PI * r, p = Math.min(pct, 100) / 100;
  return (
    <svg viewBox="0 0 260 260" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary-glow)" />
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <circle cx="130" cy="130" r={r} fill="none" stroke="var(--muted)" strokeWidth="16" />
      <circle cx="130" cy="130" r={r} fill="none" stroke="url(#rg)" strokeWidth="16" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - p)} filter="url(#glow)" opacity="0.5" className="transition-all duration-700" />
      <circle cx="130" cy="130" r={r} fill="none" stroke="url(#rg)" strokeWidth="16" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - p)} className="transition-all duration-700" />
    </svg>
  );
}

function HourChart({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 1);
  const now = new Date().getHours();
  const empty = hours.every((h) => h === 0);
  return (
    <div>
      <div className="flex h-32 items-end gap-[3px]" role="img" aria-label="Шаги по часам">
        {hours.map((v, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end">
            <div
              title={`${i}:00 — ${fmt(v)} шагов`}
              className={`w-full rounded-t-md transition-all duration-500 ${v ? "bg-gradient-primary" : "bg-muted"} ${i === now ? "ring-1 ring-primary-glow" : ""}`}
              style={{ height: v ? `${Math.max(6, (v / max) * 100)}%` : "4px" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>0</span><span>6</span><span>12</span><span>18</span><span>23</span></div>
      {empty && <p className="mt-3 text-center text-sm text-muted-foreground">Пока нет активности. Включите датчик или добавьте шаги вручную.</p>}
    </div>
  );
}

function elapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function Today() {
  const st = useSteps();
  const { settings, steps, todayData } = st;
  const [manual, setManual] = useState("");
  const [, tick] = useState(0);
  const pct = Math.round((steps / settings.goal) * 100);
  const showCelebrate = steps >= settings.goal && !todayData.celebrated;

  useEffect(() => {
    if (st.gps.status !== "active") return;
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [st.gps.status]);

  if (!st.ready) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground" aria-busy>Загрузка…</div>;
  }

  const hours = settings.demo ? todayData.demo : todayData.real;
  const manualN = clampInt(manual, 1, 50000, 0);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="font-display text-xl font-semibold text-gradient">Alex'step</p>
          <p className="text-sm text-muted-foreground capitalize">{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        {settings.demo && (
          <Link to="/settings" className="rounded-full bg-warning/15 px-3 py-1.5 text-xs font-bold text-warning">Демо-режим</Link>
        )}
      </header>

      {!settings.onboarded && (
        <Card className="border-primary/40">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-glow" />
            <div className="text-sm">
              <p className="font-semibold">Добро пожаловать!</p>
              <p className="mt-1 text-muted-foreground">
                Alex'step считает шаги через датчик движения браузера. Это работает, только пока экран включён и вкладка открыта, и не на всех Android-браузерах. Точность ниже, чем у встроенного шагомера телефона.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn variant="primary" onClick={() => st.updateSettings({ onboarded: true })}>Понятно</Btn>
                <Link to="/about" className="inline-flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold text-primary-glow">Подробнее</Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {showCelebrate && (
        <div role="status" className="surface flex items-center gap-3 border-success/40 p-4 animate-pop">
          <Trophy className="h-8 w-8 shrink-0 text-success" />
          <div className="flex-1">
            <p className="font-semibold">Цель дня выполнена! 🎉</p>
            <p className="text-sm text-muted-foreground">{fmt(steps)} шагов — так держать.</p>
          </div>
          <button onClick={st.markCelebrated} aria-label="Закрыть" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
      )}

      <Card className="flex flex-col items-center">
        <div className="relative aspect-square w-full max-w-[290px]">
          <Ring pct={pct} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Activity className="mb-1 h-5 w-5 text-primary-glow" aria-hidden />
            <p className="font-display text-5xl font-bold tabular-nums" aria-live="polite">{fmt(steps)}</p>
            <p className="text-sm text-muted-foreground">из {fmt(settings.goal)} шагов</p>
            <p className="mt-2 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">{pct}%</p>
          </div>
        </div>
        <p className="mt-4 text-center font-semibold">{status(pct)}</p>
        <p className="text-sm text-muted-foreground">
          {steps >= settings.goal ? "Каждый шаг сверх цели — бонус" : `Осталось ${fmt(settings.goal - steps)} шагов`}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <RouteIcon className="h-5 w-5 text-primary-glow" />
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{kmFor(steps, settings).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">км · оценка</p>
        </Card>
        <Card className="p-4">
          <Flame className="h-5 w-5 text-warning" />
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{fmt(kcalFor(steps, settings))}</p>
          <p className="text-xs text-muted-foreground">ккал · оценка</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Активность по часам</h2>
        <HourChart hours={hours} />
      </Card>

      {/* Tracking */}
      <Card>
        <h2 className="font-semibold">Подсчёт шагов</h2>
        {settings.demo ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Демо-режим: шаги симулируются и хранятся отдельно от реальных.</p>
            <Btn variant="primary" className="mt-4 w-full" onClick={() => st.setSimulating(!st.simulating)}>
              {st.simulating ? <><Pause className="h-4 w-4" /> Остановить симуляцию</> : <><Play className="h-4 w-4" /> Симулировать ходьбу</>}
            </Btn>
          </>
        ) : (
          <>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${st.sensor === "active" ? "bg-success animate-pulse-soft" : "bg-muted-foreground"}`} />
              {st.sensor === "active" ? "Датчик движения активен — держите экран включённым" : st.sensor === "requesting" ? "Запрос разрешения…" : "Датчик выключен"}
            </p>
            {st.sensorMsg && <p className="mt-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">{st.sensorMsg}</p>}
            <Btn variant={st.sensor === "active" ? "secondary" : "primary"} className="mt-4 w-full"
              onClick={() => (st.sensor === "active" ? st.stopSensor() : st.startSensor())} disabled={st.sensor === "requesting"}>
              {st.sensor === "active" ? <><Square className="h-4 w-4" /> Остановить датчик</> : <><Zap className="h-4 w-4" /> Включить датчик шагов</>}
            </Btn>
          </>
        )}
        <div className="mt-4 border-t pt-4">
          <label htmlFor="manual" className="text-sm font-medium">Ручная корректировка</label>
          <div className="mt-2 flex gap-2">
            <input id="manual" inputMode="numeric" placeholder="Например, 500" value={manual}
              onChange={(e) => setManual(e.target.value.replace(/\D/g, "").slice(0, 5))}
              className="min-h-12 min-w-0 flex-1 rounded-xl border bg-input px-3 text-base outline-none focus:border-primary" />
            <Btn aria-label="Вычесть шаги" disabled={!manualN} onClick={() => { st.addSteps(-manualN); setManual(""); }}><Minus className="h-4 w-4" /></Btn>
            <Btn aria-label="Добавить шаги" variant="primary" disabled={!manualN} onClick={() => { st.addSteps(manualN); setManual(""); }}><Plus className="h-4 w-4" /></Btn>
          </div>
        </div>
      </Card>

      <GpsCard />
    </div>
  );
}

function GpsCard() {
  const { gps, startGps, stopGps, todayData } = useSteps();
  const active = gps.status === "active" || gps.status === "requesting";
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Navigation className="h-5 w-5 text-primary-glow" />
        <h2 className="font-semibold">GPS-прогулка</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Нужно разрешение на геолокацию. GPS расходует заряд батареи. Координаты не сохраняются и никуда не отправляются — считается только дистанция.
      </p>
      {active && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary p-3">
            <p className="text-xs text-muted-foreground">Время</p>
            <p className="font-display text-xl font-semibold tabular-nums">{gps.startedAt ? elapsed(Date.now() - gps.startedAt) : "—"}</p>
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <p className="text-xs text-muted-foreground">Дистанция</p>
            <p className="font-display text-xl font-semibold tabular-nums">{(gps.meters / 1000).toFixed(2)} км</p>
          </div>
          <p className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {gps.status === "requesting" ? "Поиск сигнала GPS…" : `Точность ±${Math.round(gps.accuracy ?? 0)} м · точек: ${gps.samples}`}
          </p>
        </div>
      )}
      {gps.message && !active && <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{gps.message}</p>}
      {!!todayData.gpsKm && !active && <p className="mt-3 text-sm text-muted-foreground">Пройдено по GPS сегодня: {todayData.gpsKm.toFixed(2)} км</p>}
      <Btn variant={active ? "danger" : "primary"} className="mt-4 w-full" onClick={active ? stopGps : startGps}>
        {active ? <><Square className="h-4 w-4" /> Остановить прогулку</> : <><Play className="h-4 w-4" /> Начать прогулку</>}
      </Btn>
    </Card>
  );
}
