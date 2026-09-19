import path from 'node:path';
import { config as loadBackendEnv } from 'dotenv';
// @prisma/client solo está generado en backend/node_modules (el backend es
// quien lo declara como dependencia); se importa por ruta relativa en vez
// de añadirlo como dependencia propia de la raíz, para no duplicar el
// cliente generado ni desincronizarlo del schema real.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../../../backend/node_modules/@prisma/client');

loadBackendEnv({ path: path.resolve(__dirname, '../../../backend/.env') });

// Un único cliente compartido por todos los steps que necesiten preparar o
// verificar estado directamente en la base de datos (precondiciones que la
// UI/API no puede crear por sí sola, o comprobaciones de que algo quedó
// guardado de verdad, no solo que la UI mostró un mensaje de éxito).
export const prisma = new PrismaClient();
