import { Link } from 'react-router-dom';
import { Panel } from '../components/Panel';

export function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <section className="grid gap-6 border border-slate-700 bg-slate-950/70 p-8 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Mission Control</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-100">Planet Manager</h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Guide a fragile world from primitive settlements to interstellar civilisation. Every turn reshapes ecology, industry, diplomacy and survival.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/create" className="border border-blue-400 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-500/30">Start New World</Link>
            <Link to="/dashboard" className="border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">Load Existing Planet</Link>
          </div>
        </div>
        <Panel title="Gameplay Pillars" className="bg-slate-900/70">
          <ul className="space-y-2 text-sm text-slate-200">
            <li>• Seeded planet generation for replayability</li>
            <li>• Turn-based simulation from Stone Age to Future Age</li>
            <li>• Dynamic natural, social and technology events</li>
            <li>• Resource/economy/environment balancing</li>
            <li>• Alien diplomacy and multiple endings</li>
          </ul>
        </Panel>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {['Command Centre Dashboard', 'Interactive World Map', 'Technology Tree & History'].map((title) => (
          <Panel key={title} title={title}>
            <p className="text-sm text-slate-300">Dense strategy interfaces built for long-form simulation sessions.</p>
          </Panel>
        ))}
      </section>
    </div>
  );
}
