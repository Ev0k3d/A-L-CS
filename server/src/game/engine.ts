import type { GeneratedEvent, PlanetMap, PlanetStats, PlanetType, ResourceState } from '../types/game.js';

const ERAS = [
  { name: 'Stone Age', threshold: 0 },
  { name: 'Industrial Age', threshold: 180 },
  { name: 'Digital Age', threshold: 420 },
  { name: 'Space Age', threshold: 760 },
  { name: 'Future Age', threshold: 1100 }
];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = (h ^ seed.charCodeAt(i)) * 16777619;
  return Math.abs(h >>> 0);
}

function rngFactory(seed: string): () => number {
  let t = hashSeed(seed);
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const climatesByType: Record<PlanetType, string[]> = {
  'Earth-like': ['Temperate', 'Subtropical', 'Mixed continental'],
  'Desert world': ['Arid', 'Hot dry', 'Dust-storm belts'],
  'Ocean world': ['Humid', 'Monsoon', 'Deep-sea thermal'],
  'Frozen planet': ['Permafrost', 'Subzero', 'Glacial winds'],
  'Volcanic planet': ['Ash-laden', 'Thermal unstable', 'Lava basin'],
  'Alien ecosystem': ['Bioluminescent', 'Spore cloud', 'Reactive atmosphere'],
  'Artificial planet': ['Controlled biospheres', 'Segmented climate', 'Synthetic weather']
};

export function createStartingState(type: PlanetType, seed: string): {
  resources: ResourceState;
  stats: PlanetStats;
  mapData: PlanetMap;
  climate: string;
  threatLevel: 'Low' | 'Medium' | 'High';
} {
  const rng = rngFactory(seed + type);
  const population = Math.floor(8000 + rng() * 20000);
  const resources: ResourceState = {
    food: Math.floor(60 + rng() * 40),
    water: Math.floor(50 + rng() * 50),
    energy: Math.floor(20 + rng() * 30),
    minerals: Math.floor(40 + rng() * 70),
    knowledge: 8,
    money: 20
  };
  const stats: PlanetStats = {
    population,
    growthRate: 1 + rng() * 2.2,
    lifeExpectancy: 30 + Math.floor(rng() * 10),
    happiness: 45 + Math.floor(rng() * 20),
    temperature: 8 + Math.floor(rng() * 20),
    pollution: Math.floor(rng() * 12),
    biodiversity: 50 + Math.floor(rng() * 30),
    climateStability: 60 + Math.floor(rng() * 25),
    industry: 10,
    trade: 5,
    scientificProgress: 0,
    militaryStrength: 6
  };
  const continents = ['Aster', 'Bront', 'Cerulea', 'Dawnreach', 'Elyon', 'Ferrox'].sort(() => rng() - 0.5).slice(0, 3 + Math.floor(rng() * 3));
  const oceans = ['Nadir Sea', 'Pelagia', 'Auric Trench', 'Halo Gulf'].sort(() => rng() - 0.5).slice(0, 1 + Math.floor(rng() * 3));
  const regions = Array.from({ length: 8 }, (_, i) => ({
    name: `Sector ${String.fromCharCode(65 + i)}`,
    explored: i < 3,
    cityLevel: i < 2 ? 1 : 0,
    damage: 0
  }));

  return {
    resources,
    stats,
    mapData: { continents, oceans, regions },
    climate: climatesByType[type][Math.floor(rng() * climatesByType[type].length)],
    threatLevel: rng() < 0.2 ? 'High' : rng() < 0.6 ? 'Medium' : 'Low'
  };
}

export function resolveEra(science: number): string {
  let current = ERAS[0].name;
  for (const era of ERAS) {
    if (science >= era.threshold) current = era.name;
  }
  return current;
}

export function nextTurnLength(era: string): number {
  return era === 'Stone Age' || era === 'Industrial Age' ? 1 : 10;
}

export function generateEvent(seed: string, year: number, era: string): GeneratedEvent | null {
  const rng = rngFactory(`${seed}-${year}-${era}`);
  if (rng() < 0.56) return null;

  const eventPool: GeneratedEvent[] = [
    {
      category: 'Natural',
      title: 'Superstorm Front',
      description: 'A hyper-storm system threatens major population centers.',
      choices: [
        { label: 'Fortify infrastructure', description: 'Spend minerals and money to reduce long-term damage.', effects: { minerals: -8, money: -10, happiness: 3, climateStability: 4 } },
        { label: 'Evacuate region', description: 'Protect lives but disrupt productivity.', effects: { industry: -4, happiness: -2, population: -400 } },
        { label: 'Do nothing', description: 'Risk immediate devastation.', effects: { population: -1800, pollution: 8, climateStability: -10 } }
      ]
    },
    {
      category: 'Social',
      title: 'Civil Reform Movement',
      description: 'Citizens demand representation and social reforms.',
      choices: [
        { label: 'Adopt reforms', description: 'Improve happiness and stability over time.', effects: { happiness: 9, money: -6, trade: 4 } },
        { label: 'Suppress dissent', description: 'Maintain control at social cost.', effects: { militaryStrength: 5, happiness: -10, pollution: 2 } },
        { label: 'Negotiate compromise', description: 'Balanced but slower outcomes.', effects: { happiness: 4, scientificProgress: 10, money: -2 } }
      ]
    },
    {
      category: 'Tech',
      title: 'Ancient Signal Detected',
      description: 'A mysterious deep-space transmission pulses through observatories.',
      choices: [
        { label: 'Study the signal', description: 'Advance science with unknown risk.', effects: { knowledge: 15, scientificProgress: 22, happiness: -1 } },
        { label: 'Ignore it', description: 'Avoid risk but lose opportunity.', effects: { happiness: 1, scientificProgress: -8 } },
        { label: 'Attempt communication', description: 'Potential contact and instability.', effects: { scientificProgress: 15, militaryStrength: 4, climateStability: -2 } }
      ]
    }
  ];

  const idx = Math.floor(rng() * eventPool.length);
  return eventPool[idx];
}

export function applyTurn(state: {
  year: number;
  turnLengthYears: number;
  resources: ResourceState;
  stats: PlanetStats;
  era: string;
}): { year: number; resources: ResourceState; stats: PlanetStats; era: string; turnLengthYears: number; winState?: string } {
  const years = state.turnLengthYears;
  const popGrowth = Math.floor((state.stats.population * (state.stats.growthRate / 100)) * years);

  const resources: ResourceState = {
    food: Math.max(0, state.resources.food + Math.floor(state.stats.industry * 0.3) - Math.floor(state.stats.population / 50000)),
    water: Math.max(0, state.resources.water - Math.floor(state.stats.population / 70000) + Math.floor(state.stats.climateStability / 20)),
    energy: Math.max(0, state.resources.energy + Math.floor(state.stats.industry / 8) - Math.floor(state.stats.pollution / 10)),
    minerals: Math.max(0, state.resources.minerals + 3 - Math.floor(state.stats.industry / 7)),
    knowledge: Math.max(0, state.resources.knowledge + Math.floor(state.stats.scientificProgress / 40) + years),
    money: Math.max(0, state.resources.money + Math.floor(state.stats.trade / 2) + Math.floor(state.stats.industry / 5))
  };

  const stats: PlanetStats = {
    ...state.stats,
    population: Math.max(0, state.stats.population + popGrowth - Math.max(0, 600 - state.resources.food) * 3),
    lifeExpectancy: Math.min(115, state.stats.lifeExpectancy + (resources.knowledge > 120 ? 1 : 0)),
    happiness: Math.max(0, Math.min(100, state.stats.happiness + (resources.money > 120 ? 1 : -1) - (state.stats.pollution > 65 ? 2 : 0))),
    pollution: Math.max(0, Math.min(100, state.stats.pollution + Math.floor(state.stats.industry / 15) - Math.floor(state.stats.biodiversity / 45))),
    biodiversity: Math.max(0, Math.min(100, state.stats.biodiversity - Math.floor(state.stats.pollution / 20) + (resources.water > 80 ? 1 : 0))),
    climateStability: Math.max(0, Math.min(100, state.stats.climateStability - Math.floor(state.stats.pollution / 22) + (resources.energy > 60 ? 1 : 0))),
    industry: Math.max(0, Math.min(100, state.stats.industry + (resources.minerals > 80 ? 2 : 1))),
    trade: Math.max(0, Math.min(100, state.stats.trade + (resources.money > 80 ? 1 : 0))),
    scientificProgress: Math.max(0, state.stats.scientificProgress + Math.floor(resources.knowledge / 15) + years),
    militaryStrength: Math.max(0, Math.min(100, state.stats.militaryStrength + (state.era === 'Space Age' || state.era === 'Future Age' ? 2 : 1)))
  };

  const era = resolveEra(stats.scientificProgress);
  const year = state.year + years;
  const turnLengthYears = nextTurnLength(era);

  let winState: string | undefined;
  if (stats.pollution > 90 || stats.population < 1000) winState = 'Planetary Collapse';
  else if (era === 'Future Age' && stats.happiness > 80 && stats.climateStability > 70) winState = 'Golden Age';
  else if (era === 'Space Age' && stats.militaryStrength > 70) winState = 'Space Empire';
  else if (era === 'Future Age' && resources.knowledge > 280) winState = 'Artificial Ascension';

  return { year, resources, stats, era, turnLengthYears, winState };
}
