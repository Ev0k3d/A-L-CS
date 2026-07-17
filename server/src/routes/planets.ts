import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/db.js';
import { applyTurn, createStartingState, generateEvent } from '../game/engine.js';
import type { PlanetType } from '../types/game.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';

export const planetRouter = Router();
const gameLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});

planetRouter.use(gameLimiter);
planetRouter.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(2).max(60),
  type: z.enum(['Earth-like', 'Desert world', 'Ocean world', 'Frozen planet', 'Volcanic planet', 'Alien ecosystem', 'Artificial planet']),
  seed: z.string().min(3).max(100)
});

planetRouter.get('/', async (req: AuthedRequest, res) => {
  const planets = await prisma.planet.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      type: true,
      year: true,
      era: true,
      threatLevel: true,
      climate: true,
      updatedAt: true,
      winState: true
    }
  });
  res.json(planets);
});

planetRouter.post('/', async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  const { name, type, seed } = parsed.data;
  const starting = createStartingState(type as PlanetType, seed);

  const planet = await prisma.planet.create({
    data: {
      userId: req.userId!,
      name,
      type,
      seed,
      turnLengthYears: 1,
      era: 'Stone Age',
      threatLevel: starting.threatLevel,
      climate: starting.climate,
      government: 'Tribal Council',
      culture: 'Oral Tradition',
      resources: starting.resources,
      stats: starting.stats,
      mapData: starting.mapData,
      discoveredTech: ['Farming', 'Basic tools'],
      alienRelations: [{ species: 'Unknown', stance: 'None', trust: 0 }],
      history: [{ year: 0, entry: `Civilization founded on ${name}.` }]
    }
  });

  res.status(201).json(planet);
});

planetRouter.get('/:planetId', async (req: AuthedRequest, res) => {
  const planetId = Array.isArray(req.params.planetId) ? req.params.planetId[0] : req.params.planetId;
  const planet = await prisma.planet.findFirst({
    where: { id: planetId, userId: req.userId },
    include: { events: { orderBy: { createdAt: 'desc' }, take: 20 } }
  });

  if (!planet) {
    res.status(404).json({ error: 'Planet not found' });
    return;
  }

  res.json(planet);
});

const eventChoiceSchema = z.object({
  choiceLabel: z.string().min(1)
});

planetRouter.post('/:planetId/events/resolve', async (req: AuthedRequest, res) => {
  const parsed = eventChoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid choice' });
    return;
  }

  const planetId = Array.isArray(req.params.planetId) ? req.params.planetId[0] : req.params.planetId;
  const planet = await prisma.planet.findFirst({ where: { id: planetId, userId: req.userId } });
  if (!planet) {
    res.status(404).json({ error: 'Planet not found' });
    return;
  }

  const activeEvent = planet.activeEvent as { title: string; description: string; category: string; choices: Array<{ label: string; description: string; effects: Record<string, number> }> } | null;
  if (!activeEvent) {
    res.status(400).json({ error: 'No active event' });
    return;
  }

  const choice = activeEvent.choices.find((c) => c.label === parsed.data.choiceLabel);
  if (!choice) {
    res.status(400).json({ error: 'Choice not found' });
    return;
  }

  const resources = { ...(planet.resources as Record<string, number>) };
  const stats = { ...(planet.stats as Record<string, number>) };

  for (const [key, value] of Object.entries(choice.effects)) {
    if (key in resources) resources[key] = Math.max(0, resources[key] + value);
    if (key in stats) stats[key] = Math.max(0, stats[key] + value);
  }

  const history = [...((planet.history as Array<{ year: number; entry: string }>) ?? [])];
  history.push({ year: planet.year, entry: `${activeEvent.title}: ${choice.label}` });

  await prisma.planet.update({
    where: { id: planet.id },
    data: {
      resources,
      stats,
      activeEvent: Prisma.JsonNull,
      history
    }
  });

  await prisma.planetEvent.create({
    data: {
      planetId: planet.id,
      year: planet.year,
      category: activeEvent.category,
      title: activeEvent.title,
      description: activeEvent.description,
      choice: choice.label,
      outcome: choice.description,
      effects: choice.effects
    }
  });

  res.json({ ok: true });
});

planetRouter.post('/:planetId/turn', async (req: AuthedRequest, res) => {
  const planetId = Array.isArray(req.params.planetId) ? req.params.planetId[0] : req.params.planetId;
  const planet = await prisma.planet.findFirst({ where: { id: planetId, userId: req.userId } });
  if (!planet) {
    res.status(404).json({ error: 'Planet not found' });
    return;
  }

  if (planet.activeEvent) {
    res.status(400).json({ error: 'Resolve active event first' });
    return;
  }

  const turnResult = applyTurn({
    year: planet.year,
    turnLengthYears: planet.turnLengthYears,
    resources: planet.resources as never,
    stats: planet.stats as never,
    era: planet.era
  });

  const event = generateEvent(planet.seed, turnResult.year, turnResult.era);
  const currentTech = (planet.discoveredTech as string[]) ?? [];
  const unlocked = new Set(currentTech);

  if (turnResult.stats.scientificProgress > 70) unlocked.add('Farming');
  if (turnResult.stats.scientificProgress > 200) unlocked.add('Electricity');
  if (turnResult.stats.scientificProgress > 380) unlocked.add('Advanced medicine');
  if (turnResult.stats.scientificProgress > 700) unlocked.add('Space travel');
  if (turnResult.stats.scientificProgress > 1080) unlocked.add('Planet engineering');

  const government = turnResult.era === 'Stone Age' ? 'Tribal Council' : turnResult.era === 'Industrial Age' ? 'Nation State' : turnResult.era === 'Digital Age' ? 'Global Federation' : 'Interstellar Accord';
  const culture = turnResult.stats.happiness > 70 ? 'Innovative Harmony' : turnResult.stats.happiness > 45 ? 'Adaptive Society' : 'Fractured Populace';
  const history = [...((planet.history as Array<{ year: number; entry: string }>) ?? [])];
  history.push({ year: turnResult.year, entry: `Entered ${turnResult.era}. Population ${turnResult.stats.population.toLocaleString()}.` });

  const alienRelations = ([...(planet.alienRelations as Array<{ species: string; stance: string; trust: number }>) ?? []]);
  if (turnResult.era === 'Space Age' && alienRelations.findIndex((a) => a.species === 'Veyari Collective') === -1) {
    alienRelations.push({ species: 'Veyari Collective', stance: 'Cautious Trade', trust: 35 });
  }

  const updated = await prisma.planet.update({
    where: { id: planet.id },
    data: {
      year: turnResult.year,
      turnLengthYears: turnResult.turnLengthYears,
      era: turnResult.era,
      winState: turnResult.winState,
      resources: turnResult.resources,
      stats: turnResult.stats,
      activeEvent: event ?? Prisma.JsonNull,
      discoveredTech: Array.from(unlocked),
      government,
      culture,
      history,
      alienRelations
    },
    include: {
      events: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });

  res.json(updated);
});

planetRouter.get('/:planetId/history', async (req: AuthedRequest, res) => {
  const planetId = Array.isArray(req.params.planetId) ? req.params.planetId[0] : req.params.planetId;
  const planet = await prisma.planet.findFirst({ where: { id: planetId, userId: req.userId }, select: { history: true } });
  if (!planet) {
    res.status(404).json({ error: 'Planet not found' });
    return;
  }
  res.json(planet.history);
});

planetRouter.get('/:planetId/events', async (req: AuthedRequest, res) => {
  const planetId = Array.isArray(req.params.planetId) ? req.params.planetId[0] : req.params.planetId;
  const planet = await prisma.planet.findFirst({ where: { id: planetId, userId: req.userId } });
  if (!planet) {
    res.status(404).json({ error: 'Planet not found' });
    return;
  }

  const events = await prisma.planetEvent.findMany({
    where: { planetId: planet.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json(events);
});
