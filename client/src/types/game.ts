export type PlanetType =
  | 'Earth-like'
  | 'Desert world'
  | 'Ocean world'
  | 'Frozen planet'
  | 'Volcanic planet'
  | 'Alien ecosystem'
  | 'Artificial planet';

export type User = {
  id: string;
  email: string;
  displayName: string;
};

export type PlanetSummary = {
  id: string;
  name: string;
  type: PlanetType;
  year: number;
  era: string;
  threatLevel: string;
  climate: string;
  updatedAt: string;
  winState?: string;
};

export type PlanetEvent = {
  id: string;
  year: number;
  category: string;
  title: string;
  description: string;
  choice: string;
  outcome: string;
  effects: Record<string, number>;
};

export type ActiveEvent = {
  title: string;
  description: string;
  category: 'Natural' | 'Social' | 'Tech';
  choices: Array<{ label: string; description: string; effects: Record<string, number> }>;
};

export type PlanetDetail = {
  id: string;
  name: string;
  type: PlanetType;
  year: number;
  turnLengthYears: number;
  era: string;
  threatLevel: string;
  climate: string;
  government: string;
  culture: string;
  resources: Record<string, number>;
  stats: Record<string, number>;
  discoveredTech: string[];
  activeEvent: ActiveEvent | null;
  alienRelations: Array<{ species: string; stance: string; trust: number }>;
  mapData: { continents: string[]; oceans: string[]; regions: Array<{ name: string; explored: boolean; cityLevel: number; damage: number }> };
  history: Array<{ year: number; entry: string }>;
  events: PlanetEvent[];
  winState?: string;
};
