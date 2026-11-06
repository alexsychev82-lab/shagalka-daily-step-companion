import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, FlaskConical, Info, ShieldCheck, Trash2, Vibrate } from "lucide-react";
import { useSteps } from "@/lib/steps-store";
import { Btn, Card, PageHeader, Toggle } from "@/components/ui-kit";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Настройки — Alex'step" },
      { name: "description", content: "Цель на день, параметры тела, демо-режим и приватность в Alex'step." },
      { property: "og:title", content: "Настройки — Alex'step" },
      { property: "og:description", content: "Настройте цель шагов и параметры для оценок." },
    ],
  }),
  component: SettingsPage,
});

function NumField({ id, label, value, min, max, suffix, optional, onSave }: {
  id: string; label: string; value: number | null; min: number; max: number; suffix: string; optional?: boolean; onSave: (v: number | null) => void;
}) {
  const [v, setV] = useState(value?.toString() ?? "");
  const [saved, setSaved] = useState(false);
  useEffect(() => setV(value?.toString() ?? ""), [value]);
  const n = Number(v);
  const empty = v === "";
  const valid = empty ? !!optional : Number.isInteger(n) && n >= min && n <= max;
  const dirty = v !== (value?.toString() ?? "");
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">{label}{optional && <span className="text-muted-foreground"> · необязательно</span>}</label>
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <input id={id} inputMode="numeric" value={v} aria-invalid={!valid}
            onChange={(e) => { setV(e.target.value.replace(/\D/g, "").slice(0, 6)); setSaved(false); }}
            className={`min-h-12 w-full rounded-xl border bg-input px-3 pr-14 text-base outline-none focus:border-primary ${!valid ? "border-destructive" : ""}`} />
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>
        </div>
        <Btn variant="primary" disabled={!valid || !dirty} onClick={() => { onSave(empty ? null : n); setSaved(true); }}>
          {saved && !dirty ? <Check className="h-4 w-4" /> : "Сохранить"}
        </Btn>
      </div>
      {!valid && <p className="mt-1 text-xs text-destructive">Введите число от {min} до {max}</p>}
    </div>
  );
}

function SettingsPage() {
  const st = useSteps();
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;
  if (!st.ready) return <p className="py-20 text-center text-muted-foreground">Загрузка…</p>;
  const s = st.settings;
  const flash = (m: string) => { setDone(m); setTimeout(() => setDone(null), 2500); };

  return (
    <div className="space-y-4">
      <PageHeader title="Настройки" />
      {done && <p role="status" className="rounded-xl bg-success/15 p-3 text-sm font-medium text-success animate-rise">{done}</p>}

      <Card className="space-y-4">
        <NumField id="goal" label="Цель на день" value={s.goal} min={500} max={100000} suffix="шагов" onSave={(v) => st.updateSettings({ goal: v ?? 8000 })} />
        <NumField id="height" label="Рост" value={s.heightCm} min={100} max={250} suffix="см" optional onSave={(v) => st.updateSettings({ heightCm: v })} />
        <NumField id="weight" label="Вес" value={s.weightKg} min={30} max={300} suffix="кг" optional onSave={(v) => st.updateSettings({ weightKg: v })} />
        <p className="text-xs text-muted-foreground">Рост и вес нужны только для оценки дистанции и калорий. Без них используются средние значения.</p>
      </Card>

      <Card className="space-y-5">
        <div className="flex items-center gap-3">
          <Vibrate className="h-5 w-5 text-primary-glow" />
          <div className="flex-1">
            <p className="font-medium">Вибрация</p>
            <p className="text-xs text-muted-foreground">{canVibrate ? "Короткий отклик, когда датчик распознал ходьбу" : "Не поддерживается этим браузером"}</p>
          </div>
          <Toggle label="Вибрация" checked={s.haptics && canVibrate} onChange={(v) => canVibrate && st.updateSettings({ haptics: v })} />
        </div>
        <div className="flex items-center gap-3">
          <FlaskConical className="h-5 w-5 text-warning" />
          <div className="flex-1">
            <p className="font-medium">Демо-режим</p>
            <p className="text-xs text-muted-foreground">Симулированные шаги для проверки. Хранятся отдельно и не смешиваются с реальными.</p>
          </div>
          <Toggle label="Демо-режим" checked={s.demo} onChange={(v) => st.updateSettings({ demo: v })} />
        </div>
        {s.demo && <Btn className="w-full" onClick={() => { st.resetDemo(); flash("Демо-данные сброшены"); }}>Сбросить демо-данные</Btn>}
      </Card>

      <Card>
        <div className="flex gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
          <div className="text-sm">
            <p className="font-medium">Приватность</p>
            <p className="mt-1 text-muted-foreground">
              Все данные хранятся только в этом браузере на вашем устройстве. Без регистрации, без сервера. Координаты GPS не сохраняются и не передаются — используется только посчитанная дистанция. Очистка данных браузера удалит историю.
            </p>
          </div>
        </div>
        <Link to="/about" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold">
          <Info className="h-4 w-4" /> Как это работает
        </Link>
      </Card>

      <Card className="space-y-3">
        <Btn className="w-full" onClick={() => { st.resetToday(); flash("Шаги за сегодня сброшены"); }}>Сбросить сегодняшние шаги</Btn>
        {!confirm ? (
          <Btn variant="danger" className="w-full" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Удалить все данные</Btn>
        ) : (
          <div className="rounded-xl border border-destructive/40 p-3">
            <p className="text-sm">Удалить всю историю и настройки? Это действие нельзя отменить.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Btn onClick={() => setConfirm(false)}>Отмена</Btn>
              <Btn variant="danger" onClick={() => { st.resetAll(); setConfirm(false); flash("Все данные удалены"); }}>Удалить</Btn>
            </div>
          </div>
        )}
      </Card>
      <p className="text-center text-xs text-muted-foreground">Alex'step · MVP 0.1</p>
    </div>
  );
}
