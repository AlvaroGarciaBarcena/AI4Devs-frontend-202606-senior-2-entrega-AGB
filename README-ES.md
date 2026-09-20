# LTI - Sistema de Seguimiento de Talento

Una aplicación full-stack de reclutamiento (ATS): un frontend en React + TypeScript (construido con [Vite](https://vite.dev)) y un backend en Express + TypeScript, usando [Prisma](https://www.prisma.io) como ORM sobre PostgreSQL.

> 🇬🇧 Looking for the English version? Read [README-EN.md](./README-EN.md).

Esta guía asume una máquina **Ubuntu** recién instalada, sin nada configurado todavía. Si ya tienes git, Node.js y Docker instalados, salta directamente a [Obtén el código](#3-obtén-el-código).

## Contenido

- [1. Requisitos previos](#1-requisitos-previos)
- [2. Instala Git, Node.js y Docker](#2-instala-git-nodejs-y-docker)
- [3. Obtén el código](#3-obtén-el-código)
- [4. Configura las variables de entorno](#4-configura-las-variables-de-entorno)
- [5. Arranca la base de datos](#5-arranca-la-base-de-datos)
- [6. Instala las dependencias del proyecto](#6-instala-las-dependencias-del-proyecto)
- [7. Crea el esquema de la base de datos y los datos de ejemplo](#7-crea-el-esquema-de-la-base-de-datos-y-los-datos-de-ejemplo)
- [8. Arranca el backend](#8-arranca-el-backend)
- [9. Arranca el frontend](#9-arranca-el-frontend)
- [10. Inicia sesión](#10-inicia-sesión)
- [11. Ejecuta las pruebas automáticas](#11-ejecuta-las-pruebas-automáticas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Más documentación](#más-documentación)
- [Solución de problemas](#solución-de-problemas)

## 1. Requisitos previos

Necesitas una terminal en Ubuntu (o cualquier Linux basado en Debian) con acceso a `sudo`. Todo lo de abajo es un comando por paso, listo para copiar y pegar — nada requiere visitar ninguna web ni hacer clic en "descargar".

## 2. Instala Git, Node.js y Docker

### Git

```bash
sudo apt update
sudo apt install -y git
```

### Node.js (LTS, vía el repositorio oficial de NodeSource)

El proyecto no fija una versión concreta de Node, pero una LTS actual (22.x o superior) funciona bien:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # debería mostrar v22.x.x o superior
npm --version
```

### Docker (script oficial de instalación — la base de datos corre en un contenedor)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh
```

Añade tu usuario al grupo `docker` para no tener que escribir `sudo` antes de cada comando `docker`, y luego **cierra sesión y vuelve a entrar** (o ejecuta `newgrp docker` en tu terminal actual) para que se aplique:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Verifica que funciona:

```bash
docker run hello-world
```

## 3. Obtén el código

```bash
git clone https://github.com/LIDR-academy/AI4Devs-frontend-202606-senior-2.git
cd AI4Devs-frontend-202606-senior-2
```

Todos los comandos de aquí en adelante asumen que estás dentro de este directorio `AI4Devs-frontend-202606-senior-2/`, salvo que un paso diga lo contrario.

## 4. Configura las variables de entorno

El proyecto necesita **dos** ficheros `.env` — uno para Docker Compose (raíz) y otro para el propio backend. Ambos ya tienen una plantilla `.env.example` en el repositorio:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Abre `backend/.env` y genera un valor real para `JWT_SECRET` (se usa para firmar las sesiones de login — nunca reutilices el valor de ejemplo, ni siquiera en local):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copia el resultado en `backend/.env`, sustituyendo `JWT_SECRET=changeme`. El resto de valores (`DATABASE_URL`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`) ya funcionan tal cual para desarrollo local — no hace falta cambiarlos salvo que quieras otros distintos (si lo haces, mantén los mismos valores en **ambos** ficheros `.env`, porque Docker Compose y el backend tienen que coincidir en las credenciales de la base de datos).

## 5. Arranca la base de datos

```bash
docker compose up -d
```

Esto arranca un contenedor de PostgreSQL en segundo plano (`-d` = *detached*). Comprueba que está corriendo:

```bash
docker compose ps
```

Para pararlo más adelante: `docker compose down` (tus datos se quedan en disco; añade `-v` solo si quieres borrarlos).

## 6. Instala las dependencias del proyecto

Tres `package.json` distintos, tres instalaciones:

```bash
npm install              # raíz — solo hace falta para la suite E2E de Playwright, ver el paso 11
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## 7. Crea el esquema de la base de datos y los datos de ejemplo

Desde el directorio `backend/`:

```bash
cd backend
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
cd ..
```

- `prisma:generate` construye el cliente de Prisma a partir de `prisma/schema.prisma`.
- `prisma migrate dev` aplica las migraciones ya incluidas en `prisma/migrations/` sobre tu base de datos recién creada.
- `prisma:seed` la rellena con empresas, posiciones y candidatos de ejemplo, además de dos cuentas de empleado con las que iniciar sesión (ver el [paso 10](#10-inicia-sesión)).

## 8. Arranca el backend

En una terminal, desde `backend/`:

```bash
cd backend
npm run dev
```

Esto arranca la API en **http://localhost:3010** con recarga en caliente (`ts-node-dev`). Deja esta terminal abierta.

## 9. Arranca el frontend

En una **segunda** terminal, desde `frontend/`:

```bash
cd frontend
npm run dev
```

Esto arranca la aplicación en **http://localhost:3000**. Deja esta terminal abierta también.

## 10. Inicia sesión

Abre [http://localhost:3000](http://localhost:3000) en tu navegador. Todas las pantallas exigen sesión iniciada — no hay registro público, los empleados se siembran directamente en la base de datos. Usa una de las dos cuentas creadas en el paso 7:

| Email | Contraseña |
| --- | --- |
| `alice.johnson@lti.com` | `Changeme123!` |
| `bob.miller@lti.com` | `Changeme123!` |

Son credenciales solo para desarrollo, escritas directamente en `backend/prisma/seed.ts` — nunca se usan en ningún despliegue real.

## 11. Ejecuta las pruebas automáticas

Tres suites independientes:

```bash
# Tests unitarios/de integración del backend (Jest, base de datos mockeada — no hace falta ningún servidor arrancado)
cd backend && npm test && cd ..

# Tests unitarios del frontend (Vitest)
cd frontend && npm test && cd ..

# Tests end-to-end (Playwright) — necesitan el backend Y el frontend arrancados (pasos 8-9),
# y los propios navegadores de Playwright instalados una vez:
npx playwright install --with-deps chromium
npm run test:e2e
```

La suite E2E pilota un navegador real contra tu aplicación en marcha y cubre autenticación, alta de candidatos, el tablero de proceso de selección, cabeceras de seguridad, accesibilidad, internacionalización, subida de ficheros y más — consulta [`e2e/features/`](./e2e/features/) para ver la lista completa de escenarios en Gherkin, en lenguaje llano.

## Estructura del proyecto

```
.
├── backend/                 API en Express + TypeScript
│   ├── src/
│   │   ├── index.ts          Punto de entrada (configuración del servidor, middlewares, rutas)
│   │   ├── application/      Lógica de aplicación y servicios (los *.test.ts viven junto a su código fuente)
│   │   ├── domain/models/    Modelos de dominio (Candidate, Position, Application...), cada uno con sus propias llamadas a Prisma
│   │   ├── presentation/     Controladores y middlewares (incl. autenticación)
│   │   └── routes/           Definición de rutas de Express
│   ├── prisma/                schema.prisma, migrations/, seed.ts
│   ├── api-spec.yaml           Especificación OpenAPI de cada endpoint
│   ├── ModeloDatos.md           Descripción y diagrama del modelo de datos
│   └── ManifestoBuenasPracticas.md   Convenciones de código del backend
├── frontend/                 Aplicación en React + TypeScript (Vite)
│   └── src/
│       ├── components/        Componentes y pantallas de la interfaz
│       ├── services/          Llamadas al API (axios)
│       ├── context/            Contexto de React (estado de sesión)
│       └── i18n/                Traducciones español/inglés
├── e2e/                      Tests end-to-end con Playwright (BDD, Gherkin)
│   ├── features/               Ficheros *.feature — un escenario = una historia de usuario real
│   └── steps/                   Implementación de los pasos
├── openspec/                 Especificaciones de capacidad de lo que hace el sistema hoy, con trazabilidad a la rama/commit que implementó cada una
├── prompts-AGB.md            Diario de desarrollo: cada rama, prompt y hallazgo de la construcción de este proyecto
└── docker-compose.yml        Definición del contenedor de PostgreSQL
```

## Más documentación

- [`backend/api-spec.yaml`](./backend/api-spec.yaml) — especificación OpenAPI de cada endpoint del backend.
- [`backend/ModeloDatos.md`](./backend/ModeloDatos.md) — descripción y diagrama del modelo de datos.
- [`backend/ManifestoBuenasPracticas.md`](./backend/ManifestoBuenasPracticas.md) — convenciones de código del backend.
- [`openspec/specs/`](./openspec/specs/) — lo que hace el sistema hoy, capacidad por capacidad, con cada requisito trazado a la rama y el commit que lo implementó.
- [`docs/adr/`](./docs/adr/) — las decisiones de arquitectura reales del proyecto, una por fichero, formato corto (Nygard): qué se decidió, por qué, qué alternativas se rechazaron.
- [`BRANCHES_LOG`](./BRANCHES_LOG) — índice de las 17 ramas de este proyecto, con enlace directo a la sección de `prompts-AGB.md` que documenta cada una.
- [`prompts-AGB.md`](./prompts-AGB.md) — el historial de desarrollo completo de este proyecto: cada rama, el razonamiento detrás y los fallos reales encontrados y corregidos por el camino.

## Solución de problemas

**`docker compose up -d` falla con un error de permisos** — probablemente no has vuelto a iniciar sesión después del `usermod -aG docker` del paso 2. Ejecuta `newgrp docker` o abre una terminal nueva.

**El backend no puede conectar con la base de datos** — comprueba que `docker compose ps` muestra el contenedor `db` como `Up`, y que el `DATABASE_URL` de `backend/.env` coincide con las credenciales del `.env` de la raíz (mismo usuario/contraseña/nombre de base de datos/puerto).

**El puerto 3000 o 3010 ya está en uso** — algo más en tu máquina está usando ese puerto. Encuéntralo y detenlo (`sudo lsof -i :3000`), o ten en cuenta que el puerto del frontend está fijado en `frontend/vite.config.ts` para coincidir con la configuración de CORS del backend, así que cambiarlo exige actualizar los dos.

**`npx prisma migrate dev` pide reiniciar la base de datos** — esto solo pasa si tu base de datos local ya tiene datos en conflicto de una configuración previa distinta. En una base de datos recién creada con `docker compose` esto no debería ocurrir; si ocurre y no te importa perder los datos locales, confirma el reinicio.