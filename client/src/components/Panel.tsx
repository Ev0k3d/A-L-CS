import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{ title?: string; className?: string }>;

export function Panel({ title, className, children }: Props) {
  return (
    <section className={`border border-slate-700/70 bg-slate-950/70 p-4 shadow-[0_0_25px_rgba(31,99,255,0.1)] ${className ?? ''}`}>
      {title ? <h3 className="mb-3 border-b border-slate-700 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">{title}</h3> : null}
      {children}
    </section>
  );
}
