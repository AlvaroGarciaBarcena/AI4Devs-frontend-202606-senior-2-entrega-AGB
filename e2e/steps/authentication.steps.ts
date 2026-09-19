import path from 'node:path';
import { config as loadBackendEnv } from 'dotenv';
import jwt from 'jsonwebtoken';
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

// Credenciales de desarrollo documentadas en SECRETS.md (gitignorado) y en
// prompts-AGB.md, sección 3.19.5 -- el mismo empleado sembrado que se ha
// usado para verificar el login a mano durante toda la sesión.
const SEEDED_EMPLOYEE = {
  email: 'alice.johnson@lti.com',
  password: 'Changeme123!',
  name: 'Alice Johnson',
};

// El backend corre en un puerto distinto al frontend (baseURL de
// playwright.config.ts apunta al frontend, :3000); los escenarios que
// hablan con la API directamente (sin pasar por el navegador) necesitan
// la URL completa del backend.
const API_URL = 'http://localhost:3010';

// Necesario para "Token caducado": firmar un JWT con la misma clave que usa
// el backend de verdad (backend/.env, nunca committeada), no un secreto
// inventado -- si no, el backend lo rechazaría por firma inválida, no por
// caducado, y el escenario no probaría lo que dice probar.
loadBackendEnv({ path: path.resolve(__dirname, '../../backend/.env') });

const signExpiredToken = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no cargado desde backend/.env -- revisa que el fichero exista');
  }
  // Mismo payload que authService.ts (sub/role/companyId), con `exp` ya en
  // el pasado en vez de usar expiresIn, para no depender de que la librería
  // acepte duraciones negativas.
  return jwt.sign(
    { sub: 1, role: 'Interviewer', companyId: 1, exp: Math.floor(Date.now() / 1000) - 3600 },
    secret,
  );
};

Given('existe un empleado activo con una contraseña asignada', async ({ page }) => {
  // La precondición ya la satisface el seed de la base de datos -- este
  // paso solo deja constancia explícita de qué credenciales se usarán en
  // el WHEN, en vez de esconderlas dentro de ese paso sin más contexto.
  await page.goto('/login');
});

When('ese empleado inicia sesión con su email y su contraseña correcta', async ({ page }) => {
  await page.getByLabel('Correo electrónico').fill(SEEDED_EMPLOYEE.email);
  await page.getByLabel('Contraseña').fill(SEEDED_EMPLOYEE.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
});

Then('el sistema le deja entrar y muestra su nombre en la aplicación', async ({ page }) => {
  await expect(page).toHaveURL('/');
  await expect(page.getByText(SEEDED_EMPLOYEE.name)).toBeVisible();
});

When('ese empleado intenta iniciar sesión con su email y una contraseña incorrecta', async ({ page }) => {
  await page.getByLabel('Correo electrónico').fill(SEEDED_EMPLOYEE.email);
  await page.getByLabel('Contraseña').fill('esto-no-es-la-contraseña');
  await page.getByRole('button', { name: 'Entrar' }).click();
});

Then('el sistema muestra el mismo mensaje genérico de error, sin decir qué fue exactamente lo incorrecto', async ({ page }) => {
  await expect(page.getByRole('alert')).toHaveText('Error al iniciar sesión: Email o contraseña incorrectos');
  // Sigue en /login -- no ha entrado.
  await expect(page).toHaveURL(/\/login$/);
});

Given('no se envía ningún token de sesión', async () => {
  // No hay nada que preparar: la petición del WHEN simplemente no incluye
  // cabecera Authorization.
});

When('se solicita el listado de posiciones a la API', async ({ request }) => {
  (globalThis as { __lastResponse?: unknown }).__lastResponse = await request.get(`${API_URL}/position`);
});

Given('existe un token de sesión emitido hace más de 8 horas', async () => {
  (globalThis as { __expiredToken?: string }).__expiredToken = signExpiredToken();
});

When('se usa ese token para solicitar el listado de posiciones a la API', async ({ request }) => {
  const token = (globalThis as { __expiredToken?: string }).__expiredToken;
  (globalThis as { __lastResponse?: unknown }).__lastResponse = await request.get(`${API_URL}/position`, {
    headers: { Authorization: `Bearer ${token}` },
  });
});

Then('el sistema lo rechaza igual que si no se hubiera enviado ningún token', async () => {
  const response = (globalThis as { __lastResponse?: { status: () => number } }).__lastResponse;
  expect(response?.status()).toBe(401);
});

Then('el sistema rechaza la petición con un 401, sin revelar más información', async () => {
  const response = (globalThis as { __lastResponse?: { status: () => number } }).__lastResponse;
  expect(response?.status()).toBe(401);
});

Given('un mismo origen ya ha agotado el número de intentos de login permitidos en los últimos 15 minutos', async ({ request }) => {
  // El límite es 10/15min (index.ts, loginLimiter) -- se agotan con 10
  // intentos fallidos antes del "intento adicional" del WHEN.
  for (let i = 0; i < 10; i += 1) {
    await request.post(`${API_URL}/auth/login`, {
      data: { email: SEEDED_EMPLOYEE.email, password: 'contraseña-incorrecta' },
    });
  }
});

When('ese origen realiza un intento adicional de inicio de sesión', async ({ request }) => {
  (globalThis as { __lastResponse?: unknown }).__lastResponse = await request.post(`${API_URL}/auth/login`, {
    data: { email: SEEDED_EMPLOYEE.email, password: SEEDED_EMPLOYEE.password },
  });
});

Then('el sistema rechaza el intento con un código de límite de peticiones alcanzado', async () => {
  const response = (globalThis as { __lastResponse?: { status: () => number } }).__lastResponse;
  expect(response?.status()).toBe(429);
});

Given('un usuario tiene una sesión iniciada y visible en la interfaz', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(SEEDED_EMPLOYEE.email);
  await page.getByLabel('Contraseña').fill(SEEDED_EMPLOYEE.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText(SEEDED_EMPLOYEE.name)).toBeVisible();
});

When('pulsa "Cerrar sesión"', async ({ page }) => {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
});

Then('el sistema borra la sesión guardada y muestra la pantalla de inicio de sesión', async ({ page }) => {
  await expect(page).toHaveURL(/\/login$/);
  const stored = await page.evaluate(() => localStorage.getItem('lti_auth'));
  expect(stored).toBeNull();
});

Given('el cliente tiene guardada una sesión cuyo token ya no es válido en el servidor', async ({ page }) => {
  // Un token con firma inválida (no el caducado de antes, para no depender
  // del orden de ejecución entre escenarios) sirve igual: el servidor lo
  // rechaza con 401 de todas formas, que es lo único que le importa al
  // interceptor de apiClient.js.
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('lti_auth', JSON.stringify({
      token: 'firma.invalida.a-propósito',
      employee: { id: 1, name: 'Alice Johnson', email: 'alice.johnson@lti.com', role: 'Interviewer', companyId: 1 },
    }));
  });
});

When('esa persona navega a una pantalla que hace una petición a la API', async ({ page }) => {
  await page.goto('/positions');
});

Then('el sistema borra la sesión guardada y redirige a la pantalla de inicio de sesión, sin intervención del usuario', async ({ page }) => {
  await expect(page).toHaveURL(/\/login$/);
  const stored = await page.evaluate(() => localStorage.getItem('lti_auth'));
  expect(stored).toBeNull();
});
