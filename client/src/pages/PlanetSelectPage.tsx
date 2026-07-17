import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Panel } from '../components/Panel';
import type { PlanetSummary } from '../types/game';

export function PlanetSelectPage() {
  const [planets, setPlanets] = useState<PlanetSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PlanetSummary[]>('/planets')
      .then(setPlanets)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load planets'));
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Panel title="Planet Archives">
        {error ? <p className="text-red-300">{error}</p> : null}
        <div className="space-y-3">
          {planets.map((planet) => (
            <Link key={planet.id} to={`/dashboard/${planet.id}`} className="block border border-slate-700 bg-slate-900/70 p-3 hover:border-blue-400">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{planet.name}</h3>
                <span className="text-xs uppercase tracking-wider text-slate-400">{planet.era}</span>
              </div>
              <p className="mt-1 text-sm text-slate-300">{planet.type} • Year {planet.year} • Threat {planet.threatLevel} • Climate {planet.climate}</p>
              {planet.winState ? <p className="mt-1 text-xs text-emerald-300">Ending: {planet.winState}</p> : null}
            </Link>
          ))}
          {planets.length === 0 ? <p className="text-sm text-slate-400">No planets yet. Generate one from Planet Creation.</p> : null}
        </div>
      </Panel>
    </div>
  );
}
