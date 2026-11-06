import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { useSteps, daySteps, kmFor, dateKey } from "@/lib/steps-store";
import { Card, PageHeader, fmt } from "@/components/ui-kit";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "История — Alex'step" },
      { name: "description", content: "Шаги за последние дни в Alex'step." },
      { property: "og:title", content: "История — Alex'step" },
      { property: "og:description", content: "История шагов за последние 30 дней." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { days, settings, ready } = useSteps();
  if (!ready) return <p className="py-20 text-center text-muted-foreground">Загрузка…</p>;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { d, steps: daySteps(days[dateKey(d)], settings.demo) };
  });
  const max = Math.max(settings.goal, ...last7.map((x) => x.steps));
  const list = Object.keys(days).sort().reverse()
    .map((k) => ({ k, steps: daySteps(days[k], settings.demo) }))
    .filter((x) => x.steps > 0);
  const avg = Math.round(last7.reduce((a, b) => a + b.steps, 0) / 7);

  return (
    <div className="space-y-4">
      <PageHeader title="История" subtitle={settings.demo ? "Показаны демо-данные" : "Последние 30 дней на этом устройстве"} />
      <Card>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-semibold">7 дней</h2>
          <p className="text-sm text-muted-foreground">в среднем {fmt(avg)}</p>
        </div>
        <div className="relative flex h-40 items-end gap-2">
          <div className="absolute inset-x-0 border-t border-dashed border-primary-glow/50" style={{ bottom: `${(settings.goal / max) * 100}%` }} aria-hidden />
          {last7.map(({ d, steps }) => (
            <div key={d.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div className={`w-full rounded-t-lg ${steps >= settings.goal ? "bg-gradient-primary shadow-glow" : steps ? "bg-accent" : "bg-muted"}`}
                style={{ height: steps ? `${Math.max(4, (steps / max) * 100)}%` : "4px" }} title={`${fmt(steps)} шагов`} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {last7.map(({ d }) => (
            <span key={d.toISOString()} className="flex-1 text-center text-[11px] text-muted-foreground capitalize">
              {d.toLocaleDateString("ru-RU", { weekday: "short" })}
            </span>
          ))}
        </div>
      </Card>

      {list.length === 0 ? (
        <Card className="text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 font-semibold">История пока пуста</p>
          <p className="text-sm text-muted-foreground">Здесь появятся дни, когда вы ходили.</p>
        </Card>
      ) : (
        <Card className="p-2">
          <ul className="divide-y">
            {list.map(({ k, steps }) => {
              const [y, m, d] = k.split("-").map(Number);
              const done = steps >= settings.goal;
              return (
                <li key={k} className="flex items-center gap-3 px-3 py-3">
                  {done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <span className="h-5 w-5 rounded-full border-2 border-muted" />}
                  <div className="flex-1">
                    <p className="font-medium capitalize">{new Date(y, m - 1, d).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
                    <p className="text-xs text-muted-foreground">{kmFor(steps, settings).toFixed(2)} км (оценка)</p>
                  </div>
                  <p className="font-display font-semibold tabular-nums">{fmt(steps)}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
