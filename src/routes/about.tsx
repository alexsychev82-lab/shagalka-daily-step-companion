import { createFileRoute } from "@tanstack/react-router";
import { Activity, BatteryWarning, Navigation, Smartphone, Calculator, Lock } from "lucide-react";
import { Card, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Как это работает — Alex'step" },
      { name: "description", content: "Как Alex'step считает шаги, ограничения браузера и планы на нативное Android-приложение." },
      { property: "og:title", content: "Как это работает — Alex'step" },
      { property: "og:description", content: "Честно об ограничениях браузерного шагомера." },
    ],
  }),
  component: About,
});

const ITEMS = [
  { icon: Activity, t: "Датчик движения", d: "Приложение читает акселерометр через браузер и ищет ритмичные пики, похожие на шаги. Шаги засчитываются только после 4 подряд шагов в естественном темпе — так встряхивания телефона почти не учитываются." },
  { icon: Smartphone, t: "Ограничения браузера", d: "Подсчёт работает, только пока вкладка открыта и экран включён. В фоне браузер останавливает датчики. Некоторые Android-браузеры не дают доступ к датчику вовсе. Точность ниже, чем у встроенного шагомера." },
  { icon: Navigation, t: "GPS-прогулка", d: "Во время сессии дистанция считается по точкам геолокации (формула гаверсинуса). Неточные точки (хуже 50 м) отбрасываются. Координаты не сохраняются." },
  { icon: BatteryWarning, t: "Батарея", d: "GPS и постоянная работа датчика заметно расходуют заряд. Останавливайте прогулку, когда закончите." },
  { icon: Calculator, t: "Оценки", d: "Дистанция = шаги × длина шага (≈ 41% роста или 75 см). Калории — грубая оценка по весу. Это не медицинские данные." },
  { icon: Lock, t: "Данные на устройстве", d: "Всё хранится локально в браузере. Регистрация и интернет-сервер не нужны. Если датчик не работает — добавляйте шаги вручную." },
];

function About() {
  return (
    <div className="space-y-4">
      <PageHeader title="Как это работает" subtitle="Честно о возможностях браузерного шагомера" />
      {ITEMS.map(({ icon: Icon, t, d }) => (
        <Card key={t} className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent"><Icon className="h-5 w-5 text-primary-glow" /></div>
          <div><h2 className="font-semibold">{t}</h2><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
        </Card>
      ))}
      <Card className="border-primary/40">
        <h2 className="font-semibold text-gradient">Дальше: нативное Android-приложение</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Надёжный подсчёт в фоне и точность системного шагомера (Android Sensor.TYPE_STEP_COUNTER), а также установка в виде APK возможны только в нативной обёртке или отдельном Android-приложении. Это следующий этап — текущая версия является веб-прототипом.
        </p>
      </Card>
    </div>
  );
}
