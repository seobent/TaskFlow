import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
  footer?: ReactNode;
  subtitle: string;
  title: string;
};

export function AuthCard({ children, footer, subtitle, title }: AuthCardProps) {
  return (
    <section className="w-full max-w-md rounded-md border border-ink/10 bg-white p-6 shadow-xl shadow-ink/5 sm:p-8">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink/60">{subtitle}</p>
      </div>
      {children}
      {footer ? (
        <div className="mt-6 border-t border-ink/10 pt-5 text-sm text-ink/60">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
