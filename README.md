# Planet Manager

Planet Manager is a full-stack browser strategy simulation where you guide a planet from primitive civilisation to a potential interstellar future.

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS + React Router + Recharts
- **Backend:** Node.js + Express + TypeScript
- **Database:** Prisma + SQLite
- **Auth:** JWT-based account registration/login

## Features Implemented

- User account creation and login
- Save/load multiple planets per user
- Planet creation with type + seed-based generation
- Turn-based simulation loop with era progression
- Resource, population, environment, economy and civilisation stats
- Dynamic events with branching choices and persistent consequences
- World map panel with exploration and regions
- Technology progression across Stone → Future ages
- Event archive and civilisation history timeline
- Alien diplomacy panel and ending states
- Cinematic landing + dense command-centre dashboard UI

## Project Layout

- `/client` – React app and game UI screens
- `/server` – API, simulation engine, persistence, auth

## Local Setup

1. Install dependencies at the repository root:

   ```bash
   npm install
   ```

2. Configure backend environment:

   ```bash
   cp /home/runner/work/A-L-CS/A-L-CS/server/.env.example /home/runner/work/A-L-CS/A-L-CS/server/.env
   ```

3. Initialize database:

   ```bash
   npm run db:generate -w server
   npm run db:push -w server
   ```

4. Run backend and frontend:

   ```bash
   npm run dev
   ```

   - API: `http://localhost:4000/api`
   - App: `http://localhost:5173`

## Validation

- Lint: `npm run lint`
- Build: `npm run build`
- Test: `npm run test`

