# LTI - Talent Tracking System

A full-stack recruiting/ATS application: a React + TypeScript frontend (built with [Vite](https://vite.dev)) and an Express + TypeScript backend, using [Prisma](https://www.prisma.io) as the ORM over PostgreSQL.

> 🇪🇸 ¿Buscas la versión en español? Lee [README-ES.md](./README-ES.md).

This guide assumes a fresh **Ubuntu** machine with nothing installed yet. If you already have git, Node.js and Docker set up, skip straight to [Get the code](#3-get-the-code).

## Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Install Git, Node.js and Docker](#2-install-git-nodejs-and-docker)
- [3. Get the code](#3-get-the-code)
- [4. Configure environment variables](#4-configure-environment-variables)
- [5. Start the database](#5-start-the-database)
- [6. Install project dependencies](#6-install-project-dependencies)
- [7. Create the database schema and seed data](#7-create-the-database-schema-and-seed-data)
- [8. Run the backend](#8-run-the-backend)
- [9. Run the frontend](#9-run-the-frontend)
- [10. Log in](#10-log-in)
- [11. Run the automated tests](#11-run-the-automated-tests)
- [Project structure](#project-structure)
- [Further documentation](#further-documentation)
- [Troubleshooting](#troubleshooting)

## 1. Prerequisites

You need a terminal on Ubuntu (or another Debian-based Linux) with `sudo` access. Everything below is a single copy-pasteable command per step — nothing requires visiting a website or clicking "download".

## 2. Install Git, Node.js and Docker

### Git

```bash
sudo apt update
sudo apt install -y git
```

### Node.js (LTS, via the official NodeSource repository)

The project doesn't pin a specific Node version, but a current LTS (22.x or newer) works well:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v22.x.x or newer
npm --version
```

### Docker (official install script — the database runs in a container)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh
```

Add your user to the `docker` group so you don't have to type `sudo` before every `docker` command, then **log out and back in** (or run `newgrp docker` in your current terminal) for it to take effect:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Verify it works:

```bash
docker run hello-world
```

## 3. Get the code

```bash
git clone https://github.com/LIDR-academy/AI4Devs-frontend-202606-senior-2.git
cd AI4Devs-frontend-202606-senior-2
```

Every command from here on assumes you're inside this `AI4Devs-frontend-202606-senior-2/` directory unless a step says otherwise.

## 4. Configure environment variables

The project needs **two** `.env` files — one for Docker Compose (root) and one for the backend app itself. Both have a `.env.example` template already in the repo:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Open `backend/.env` and generate a real value for `JWT_SECRET` (used to sign login sessions — never reuse the placeholder, even for local development):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the output into `backend/.env`, replacing `JWT_SECRET=changeme`. The other values (`DATABASE_URL`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`) already work out of the box for local development — no need to change them unless you know you want different ones (if you do, keep the same values in **both** `.env` files, since Docker Compose and the backend need to agree on the database credentials).

## 5. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL container in the background (`-d` = detached). Check it's running:

```bash
docker compose ps
```

To stop it later: `docker compose down` (your data stays on disk; add `-v` only if you want to wipe it).

## 6. Install project dependencies

Three separate `package.json` files, three installs:

```bash
npm install              # root — only needed for the Playwright E2E suite, see step 11
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## 7. Create the database schema and seed data

From the `backend/` directory:

```bash
cd backend
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
cd ..
```

- `prisma:generate` builds the Prisma client from `prisma/schema.prisma`.
- `prisma migrate dev` applies the migrations already committed in `prisma/migrations/` to your fresh database.
- `prisma:seed` populates it with example companies, positions, candidates and two employee accounts you can log in with (see [step 10](#10-log-in)).

## 8. Run the backend

In one terminal, from `backend/`:

```bash
cd backend
npm run dev
```

This starts the API at **http://localhost:3010** with hot reload (`ts-node-dev`). Leave this terminal running.

## 9. Run the frontend

In a **second** terminal, from `frontend/`:

```bash
cd frontend
npm run dev
```

This starts the app at **http://localhost:3000**. Leave this terminal running too.

## 10. Log in

Open [http://localhost:3000](http://localhost:3000) in your browser. Every screen requires a session — there's no public sign-up, employees are seeded directly into the database. Use one of the two accounts created in step 7:

| Email | Password |
| --- | --- |
| `alice.johnson@lti.com` | `Changeme123!` |
| `bob.miller@lti.com` | `Changeme123!` |

These are development-only credentials, hardcoded in `backend/prisma/seed.ts` — never used in any real deployment.

## 11. Run the automated tests

Three independent suites:

```bash
# Backend unit/integration tests (Jest, mocked database — no server needs to be running)
cd backend && npm test && cd ..

# Frontend unit tests (Vitest)
cd frontend && npm test && cd ..

# End-to-end tests (Playwright) — needs backend AND frontend running (steps 8-9),
# and Playwright's own browser binaries installed once:
npx playwright install --with-deps chromium
npm run test:e2e
```

The E2E suite drives a real browser against your running app and covers authentication, candidate intake, the hiring pipeline, security headers, accessibility, internationalization, file uploads and more — see [`e2e/features/`](./e2e/features/) for the full list of scenarios in plain-language Gherkin.

## Project structure

```
.
├── backend/                 Express + TypeScript API
│   ├── src/
│   │   ├── index.ts          Entry point (server setup, middleware, routes)
│   │   ├── application/      Application/business logic and services (*.test.ts files live next to their source)
│   │   ├── domain/models/    Domain models (Candidate, Position, Application...), each owning its own Prisma calls
│   │   ├── presentation/     Controllers and middleware (incl. auth)
│   │   └── routes/           Express route definitions
│   ├── prisma/                schema.prisma, migrations/, seed.ts
│   ├── api-spec.yaml           OpenAPI spec for every endpoint
│   ├── ModeloDatos.md           Data model description and diagram
│   └── ManifestoBuenasPracticas.md   Backend coding conventions
├── frontend/                 React + TypeScript app (Vite)
│   └── src/
│       ├── components/        UI components and pages
│       ├── services/          API client calls (axios)
│       ├── context/            React context (auth state)
│       └── i18n/                Spanish/English translations
├── e2e/                      Playwright end-to-end tests (BDD, Gherkin)
│   ├── features/               *.feature files — one scenario = one real user story
│   └── steps/                   Step implementations
├── openspec/                 Capability specs describing what the system does today, with traceability to the branch/commit that implemented each one
├── prompts-AGB.md            Development journal: every branch, prompt and finding from building this project
└── docker-compose.yml        PostgreSQL container definition
```

## Further documentation

- [`backend/api-spec.yaml`](./backend/api-spec.yaml) — OpenAPI specification of every backend endpoint.
- [`backend/ModeloDatos.md`](./backend/ModeloDatos.md) — data model description and diagram.
- [`backend/ManifestoBuenasPracticas.md`](./backend/ManifestoBuenasPracticas.md) — backend coding conventions.
- [`openspec/specs/`](./openspec/specs/) — what the system does today, capability by capability, each requirement traced to the branch and commit that implemented it.
- [`docs/adr/`](./docs/adr/) — this project's real architecture decisions, one per file, short Nygard format: what was decided, why, and which alternatives were rejected.
- [`BRANCHES_LOG`](./BRANCHES_LOG) — index of this project's 24 branches, each linked directly to the `prompts-AGB.md` section that documents it.
- [`prompts-AGB.md`](./prompts-AGB.md) — the full development history of this project: every branch, the reasoning behind it, and real bugs found and fixed along the way.

## Troubleshooting

**`docker compose up -d` fails with a permission error** — you likely haven't re-logged in after step 2's `usermod -aG docker`. Run `newgrp docker` or open a new terminal.

**Backend can't connect to the database** — make sure `docker compose ps` shows the `db` container as `Up`, and that `backend/.env`'s `DATABASE_URL` matches the credentials in the root `.env` (same user/password/db name/port).

**Port 3000 or 3010 already in use** — something else on your machine is using that port. Find and stop it (`sudo lsof -i :3000`), or note that the frontend's port is hardcoded in `frontend/vite.config.ts` to match the backend's CORS configuration, so changing it requires updating both.

**`npx prisma migrate dev` asks to reset the database** — this only happens if your local database already has conflicting data from a previous, different setup. On a genuinely fresh `docker compose` database this shouldn't happen; if it does and you don't mind losing local data, confirm the reset.