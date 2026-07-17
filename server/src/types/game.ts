export type PlanetType =
  | 'Earth-like'
  | 'Desert world'
  | 'Ocean world'
  | 'Frozen planet'
  | 'Volcanic planet'
  | 'Alien ecosystem'
  | 'Artificial planet';

export type ResourceState = {
  food: number;
  water: number;
  energy: number;
  minerals: number;
  knowledge: number;
  money: number;
};

export type PlanetStats = {
  population: number;
  growthRate: number;
  lifeExpectancy: number;
  happiness: number;
  temperature: number;
  pollution: number;
  biodiversity: number;
  climateStability: number;
  industry: number;
  trade: number;
  scientificProgress: number;
  militaryStrength: number;
};

export type EventChoice = {
  label: string;
  effects: Partial<ResourceState & PlanetStats>;
  description: string;
};

export type GeneratedEvent = {
  category: 'Natural' | 'Social' | 'Tech';
  title: string;
  description: string;
  choices: EventChoice[];
};

export type PlanetMap = {
  continents: string[];
  oceans: string[];
  regions: { name: string; explored: boolean; cityLevel: number; damage: number }[];
};
