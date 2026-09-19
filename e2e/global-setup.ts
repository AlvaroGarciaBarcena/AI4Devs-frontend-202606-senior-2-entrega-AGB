import path from 'node:path';
import { chromium, FullConfig } from '@playwright/test';

const SEEDED_EMPLOYEE = {
  email: 'alice.johnson@lti.com',
  password: 'Changeme123!',
};

export const AUTH_STATE_PATH = path.resolve(__dirname, '.auth/state.json');

// Un único login real por ejecución de la suite, en vez de uno por
// escenario -- con muchos escenarios necesitando sesión (candidate-intake,
// position-catalog, hiring-pipeline...), repetir el login real de verdad
// en cada uno agota el limitador de /auth/login (10/15min) a mitad de
// suite (confirmado: 10 escenarios de candidate-intake por sí solos ya lo
// dejaban en el límite). El login en sí ya lo cubren a fondo los
// escenarios de authentication.feature; el resto de capacidades solo
// necesita partir de una sesión válida, no volver a probar el login.
export default async function globalSetup(config: FullConfig) {
  const baseURL = (config.projects[0].use.baseURL as string) ?? 'http://localhost:3000';
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: 'es-ES' });

  await page.goto(`${baseURL}/login`);
  await page.getByLabel('Correo electrónico').fill(SEEDED_EMPLOYEE.email);
  await page.getByLabel('Contraseña').fill(SEEDED_EMPLOYEE.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(`${baseURL}/`);

  await page.context().storageState({ path: AUTH_STATE_PATH });
  await browser.close();
}
