import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Footprints, History, Settings, Info } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StepsProvider } from "@/lib/steps-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold">404</h1>
        <p className="mt-4 text-muted-foreground">Страница не найдена.</p>
        <Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
          На главную
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#111015" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "Alex'step — шагомер" },
      { name: "description", content: "Alex'step — шагомер с целью на день, GPS-прогулками и историей. Данные остаются на устройстве." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Unbounded:wght@500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV = [
  { to: "/", label: "Сегодня", icon: Footprints },
  { to: "/history", label: "История", icon: History },
  { to: "/about", label: "Как это работает", icon: Info, short: "Инфо" },
  { to: "/settings", label: "Настройки", icon: Settings },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <StepsProvider>
        <main className="mx-auto min-h-screen w-full max-w-xl px-4 pt-4 pb-28">
          <Outlet />
        </main>
        <nav
          aria-label="Основная навигация"
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="mx-auto grid max-w-xl grid-cols-4">
            {NAV.map(({ to, label, icon: Icon, ...rest }) => (
              <li key={to}>
                <Link
                  to={to}
                  aria-label={label}
                  activeOptions={{ exact: true }}
                  className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground transition data-[status=active]:text-primary-glow"
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {"short" in rest ? rest.short : label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </StepsProvider>
    </QueryClientProvider>
  );
}
