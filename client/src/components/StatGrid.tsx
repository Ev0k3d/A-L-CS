import { Panel } from './Panel';

type Props = {
  title: string;
  data: Record<string, number | string>;
};

export function StatGrid({ title, data }: Props) {
  return (
    <Panel title={title}>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="border border-slate-800 bg-slate-900/60 p-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-400">{key.replace(/([A-Z])/g, ' $1')}</div>
            <div className="mt-1 text-base font-semibold text-slate-100">{typeof value === 'number' ? value.toLocaleString() : value}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
