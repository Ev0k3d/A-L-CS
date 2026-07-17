import { describe, expect, it } from 'vitest';
import { applyTurn, createStartingState, generateEvent } from './engine.js';

describe('engine', () => {
  it('creates deterministic starting state', () => {
    const a = createStartingState('Earth-like', 'abc');
    const b = createStartingState('Earth-like', 'abc');
    expect(a.stats.population).toBe(b.stats.population);
    expect(a.mapData.continents).toEqual(b.mapData.continents);
  });

  it('advances turn and year', () => {
    const start = createStartingState('Earth-like', 'seed-1');
    const result = applyTurn({
      year: 0,
      turnLengthYears: 1,
      era: 'Stone Age',
      resources: start.resources,
      stats: start.stats
    });

    expect(result.year).toBe(1);
    expect(result.stats.population).toBeGreaterThan(0);
    expect(result.resources.food).toBeGreaterThanOrEqual(0);
  });

  it('may generate events', () => {
    const event = generateEvent('seed', 25, 'Industrial Age');
    if (event) {
      expect(event.choices.length).toBeGreaterThan(1);
    }
  });
});
