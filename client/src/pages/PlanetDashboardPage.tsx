import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { Panel } from '../components/Panel';
import { StatGrid } from '../components/StatGrid';
import type { PlanetDetail, PlanetEvent } from '../types/game';

const tabs = [
  { key: 'overview', label: 'Command Centre' },
  { key: 'map', label: 'World Map' },
  { key: 'tech', label: 'Technology Tree' },
  { key: 'resources', label: 'Resource Management' },
  { key: 'events', label: 'Events Archive' },
  { key: 'history', label: 'Civilisation History' },
  { key: 'diplomacy', label: 'Alien Diplomacy' }
] as const;

type TabKey = (typeof tabs)[number]['key'];

export function PlanetDashboardPage() {
  const { planetId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [planet, setPlanet] = useState<PlanetDetail | null>(null);
  const [events, setEvents] = useState<PlanetEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tab = useMemo<TabKey>(() => {
    const t = new URLSearchParams(location.search).get('tab');
    return (tabs.some((x) => x.key === t) ? t : 'overview') as TabKey;
  }, [location.search]);

  const load = useCallback(async () => {
    if (!planetId) return;
    setError(null);
    try {
      const detail = await api<PlanetDetail>(`/planets/${planetId}`);
      setPlanet(detail);
      const historyEvents = await api<PlanetEvent[]>(`/planets/${planetId}/events`);
      setEvents(historyEvents);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load planet');
    }
  }, [planetId]);

  useEffect(() => {
    load();
  }, [load]);

  async function progressTurn() {
    if (!planetId || !planet) return;
    setBusy(true);
    try {
      if (planet.activeEvent) {
        await api(`/planets/${planetId}/events/resolve`, { method: 'POST', body: { choiceLabel: planet.activeEvent.choices[0].label } });
      }
      await api(`/planets/${planetId}/turn`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Turn failed');
    } finally {
      setBusy(false);
    }
  }

  async function resolveEvent(choiceLabel: string) {
    if (!planetId) return;
    setBusy(true);
    try {
      await api(`/planets/${planetId}/events/resolve`, { method: 'POST', body: { choiceLabel } });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resolve event');
    } finally {
      setBusy(false);
    }
  }

  if (!planetId) return <div className="p-6">Missing planet id.</div>;
  if (!planet) return <div className="p-6">Loading command centre...</div>;

  const chartData = [
    { name: 'Happiness', value: planet.stats.happiness },
    { name: 'Pollution', value: planet.stats.pollution },
    { name: 'Biodiversity', value: planet.stats.biodiversity },
    { name: 'Climate', value: planet.stats.climateStability },
    { name: 'Industry', value: planet.stats.industry },
    { name: 'Military', value: planet.stats.militaryStrength }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <div className="border border-slate-700 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{planet.name}</h1>
            <p className="text-sm text-slate-300">{planet.type} • Year {planet.year} • {planet.era} • Turn = {planet.turnLengthYears} year{planet.turnLengthYears > 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <button disabled={busy} onClick={progressTurn} className="border border-blue-400 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 disabled:opacity-60">Advance Turn</button>
            <Link to="/dashboard" className="border border-slate-600 px-4 py-2 text-sm">Back to Archives</Link>
          </div>
        </div>
        {planet.winState ? <p className="mt-3 border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">Ending Achieved: {planet.winState}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button key={item.key} className={`border px-3 py-1 text-xs uppercase tracking-[0.14em] ${tab === item.key ? 'border-blue-400 bg-blue-500/20 text-blue-100' : 'border-slate-700 text-slate-300'}`} onClick={() => navigate(`/dashboard/${planetId}?tab=${item.key}`)}>{item.label}</button>
        ))}
      </div>

      {error ? <p className="border border-red-700 bg-red-950/40 p-2 text-sm text-red-300">{error}</p> : null}

      {tab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <StatGrid title="Population" data={{ population: planet.stats.population, growthRate: `${planet.stats.growthRate.toFixed(2)}%`, lifeExpectancy: planet.stats.lifeExpectancy, happiness: planet.stats.happiness }} />
            <StatGrid title="Economy" data={{ food: planet.resources.food, water: planet.resources.water, energy: planet.resources.energy, minerals: planet.resources.minerals, money: planet.resources.money, trade: planet.stats.trade }} />
            <StatGrid title="Civilisation" data={{ government: planet.government, culture: planet.culture, scientificProgress: planet.stats.scientificProgress, militaryStrength: planet.stats.militaryStrength, climate: planet.climate, threatLevel: planet.threatLevel }} />
            <Panel title="Planet Metrics">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Bar dataKey="value" fill="#60a5fa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <div className="space-y-4">
            <Panel title="Active Event">
              {planet.activeEvent ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-blue-300">{planet.activeEvent.category}</p>
                    <h3 className="text-lg font-semibold">{planet.activeEvent.title}</h3>
                    <p className="text-sm text-slate-300">{planet.activeEvent.description}</p>
                  </div>
                  <div className="space-y-2">
                    {planet.activeEvent.choices.map((choice) => (
                      <button key={choice.label} disabled={busy} onClick={() => resolveEvent(choice.label)} className="w-full border border-slate-700 bg-slate-900 p-2 text-left text-sm hover:border-blue-400">
                        <p className="font-medium">{choice.label}</p>
                        <p className="text-xs text-slate-400">{choice.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No active event this turn.</p>
              )}
            </Panel>
            <Panel title="Recent History">
              <div className="max-h-72 space-y-2 overflow-auto text-sm">
                {planet.history.slice().reverse().slice(0, 8).map((item, idx) => (
                  <p key={`${item.year}-${idx}`} className="border border-slate-800 bg-slate-900/60 p-2">Year {item.year}: {item.entry}</p>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'map' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Planetary Map" className="lg:col-span-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {planet.mapData.regions.map((region) => (
                <div key={region.name} className="border border-slate-700 bg-slate-900/60 p-3 text-sm">
                  <p className="font-semibold">{region.name}</p>
                  <p className="text-slate-300">Explored: {region.explored ? 'Yes' : 'No'}</p>
                  <p className="text-slate-300">City level: {region.cityLevel}</p>
                  <p className="text-slate-300">Environmental damage: {region.damage}%</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Geography">
            <p className="text-xs uppercase tracking-wide text-slate-400">Continents</p>
            <ul className="mb-4 mt-2 space-y-1 text-sm text-slate-200">{planet.mapData.continents.map((x) => <li key={x}>• {x}</li>)}</ul>
            <p className="text-xs uppercase tracking-wide text-slate-400">Oceans</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-200">{planet.mapData.oceans.map((x) => <li key={x}>• {x}</li>)}</ul>
          </Panel>
        </div>
      ) : null}

      {tab === 'tech' ? (
        <Panel title="Technology Tree">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { era: 'Stone Age', unlocks: ['Farming', 'Villages', 'Basic tools'] },
              { era: 'Industrial Age', unlocks: ['Factories', 'Electricity', 'Railways'] },
              { era: 'Digital Age', unlocks: ['AI', 'Robotics', 'Advanced medicine'] },
              { era: 'Space Age', unlocks: ['Space travel', 'Colonies', 'Alien exploration'] },
              { era: 'Future Age', unlocks: ['Planet engineering', 'Synthetic intelligence', 'Post-scarcity systems'] }
            ].map((node) => (
              <div key={node.era} className={`border p-3 ${planet.era === node.era ? 'border-blue-400 bg-blue-950/30' : 'border-slate-700 bg-slate-900/60'}`}>
                <p className="font-semibold">{node.era}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {node.unlocks.map((unlock) => (
                    <li key={unlock} className={planet.discoveredTech.includes(unlock) ? 'text-emerald-300' : ''}>• {unlock}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === 'resources' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <StatGrid title="Resource Stocks" data={planet.resources} />
          <StatGrid title="Environmental Systems" data={{ temperature: planet.stats.temperature, pollution: planet.stats.pollution, biodiversity: planet.stats.biodiversity, climateStability: planet.stats.climateStability }} />
        </div>
      ) : null}

      {tab === 'events' ? (
        <Panel title="Events Archive">
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="border border-slate-700 bg-slate-900/60 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{event.title}</h3>
                  <span className="text-xs uppercase tracking-wide text-slate-400">{event.category} • {event.year}</span>
                </div>
                <p className="mt-1 text-slate-300">{event.description}</p>
                <p className="mt-2 text-slate-200">Choice: {event.choice}</p>
                <p className="text-slate-400">Outcome: {event.outcome}</p>
              </div>
            ))}
            {events.length === 0 ? <p className="text-sm text-slate-400">No archived events yet.</p> : null}
          </div>
        </Panel>
      ) : null}

      {tab === 'history' ? (
        <Panel title="Civilisation Timeline">
          <div className="space-y-2">
            {planet.history.map((item, index) => (
              <div key={`${item.year}-${index}`} className="border-l-2 border-blue-400 pl-3 text-sm">
                <p className="text-blue-200">Year {item.year}</p>
                <p className="text-slate-300">{item.entry}</p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === 'diplomacy' ? (
        <Panel title="Alien Diplomacy">
          <div className="grid gap-3 md:grid-cols-2">
            {planet.alienRelations.map((relation) => (
              <div key={relation.species} className="border border-slate-700 bg-slate-900/60 p-3 text-sm">
                <p className="font-semibold">{relation.species}</p>
                <p className="text-slate-300">Status: {relation.stance}</p>
                <p className="text-slate-300">Trust: {relation.trust}</p>
                <p className="mt-2 text-xs text-slate-400">Manage trade, alliances and conflict as your civilisation reaches space.</p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
