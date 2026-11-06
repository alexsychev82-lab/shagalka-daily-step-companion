import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110",
  secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
  ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
  danger: "bg-destructive/15 text-destructive hover:bg-destructive/25",
};

export function Btn({ variant = "secondary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        variants[variant],
        className,
      )}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("surface p-5 animate-rise", className)}>{children}</section>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-8 w-14 shrink-0 rounded-full transition", checked ? "bg-gradient-primary" : "bg-muted")}
    >
      <span className={cn("absolute top-1 h-6 w-6 rounded-full bg-foreground transition-all", checked ? "left-7" : "left-1")} />
    </button>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-5 pt-2">
      <p className="font-display text-xs tracking-widest text-primary-glow uppercase">Alex'step</p>
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}

export const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");
