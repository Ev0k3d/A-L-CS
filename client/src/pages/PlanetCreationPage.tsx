import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Panel } from '../components/Panel';
import type { PlanetDetail, PlanetType } from '../types/game';

const planetTypes: PlanetType[] = ['Earth-like', 'Desert world', 'Ocean world', 'Frozen planet', 'Volcanic planet', 'Alien ecosystem', 'Artificial planet'];

export function PlanetCreationPage() {
  const [name, setName] = useState('Artemis Prime');
  const [type, setType] = useState<PlanetType>('Earth-like');
  const [seed, setSeed] = useState(() => crypto.randomUUID().slice(0, 8));
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const preview = useMemo(() => `Planet ${name} / ${type} / Seed ${seed}`, [name, type, seed]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const planet = await api<PlanetDetail>('/planets', { method: 'POST', body: { name, type, seed } });
      navigate(`/dashboard/${planet.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create planet');
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Panel title="Planet Genesis">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-300">Planet Name</span>
            <input className="w-full border border-slate-700 bg-slate-900 p-2" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-300">Planet Type</span>
            <select className="w-full border border-slate-700 bg-slate-900 p-2" value={type} onChange={(e) => setType(e.target.value as PlanetType)}>
              {planetTypes.map((planetType) => (
                <option key={planetType} value={planetType}>{planetType}</option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-slate-300">Generation Seed</span>
            <div className="flex gap-2">
              <input className="w-full border border-slate-700 bg-slate-900 p-2" value={seed} onChange={(e) => setSeed(e.target.value)} required />
              <button type="button" className="border border-slate-600 px-3" onClick={() => setSeed(crypto.randomUUID().slice(0, 8))}>Reroll</button>
            </div>
          </label>
          <div className="md:col-span-2 border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">{preview}</div>
          {error ? <p className="text-sm text-red-300 md:col-span-2">{error}</p> : null}
          <button className="md:col-span-2 border border-blue-400 bg-blue-500/20 py-2 text-sm font-semibold text-blue-100">Generate World</button>
        </form>
      </Panel>
    </div>
  );
}
