import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:opacity-90 disabled:opacity-40",
  secondary: "border border-line bg-surface text-fg hover:bg-accent disabled:opacity-40",
  ghost: "text-muted hover:text-fg hover:bg-accent disabled:opacity-40",
  danger: "text-danger hover:bg-accent",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function Badge({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "warn" | "ok" | "primary";
  children: ReactNode;
}) {
  const tones = {
    muted: "bg-accent text-muted",
    warn: "bg-warn-bg text-warn",
    ok: "bg-accent text-ok",
    primary: "bg-accent text-primary",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 ${className}`}>
      {children}
    </section>
  );
}
