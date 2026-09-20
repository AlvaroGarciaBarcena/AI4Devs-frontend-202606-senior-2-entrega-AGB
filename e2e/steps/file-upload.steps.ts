import fs from 'node:fs';
import path from 'node:path';
import { createBdd } from 'playwright-bdd';
import { expect, APIResponse } from '@playwright/test';
import { SEEDED_EMPLOYEE } from './support/seededEmployee';

const { Given, When, Then } = createBdd();

const API_URL = 'http://localhost:3010';

let authToken: string;
let response: APIResponse;

const loginForToken = async (request: import('@playwright/test').APIRequestContext) => {
  const loginResponse = await request.post(`${API_URL}/auth/login`, {
    data: { email: SEEDED_EMPLOYEE.email, password: SEEDED_EMPLOYEE.password },
  });
  return (await loginResponse.json()).token as string;
};

Given('un fichero que no declara ser PDF ni DOCX', async ({ request }) => {
  authToken = await loginForToken(request);
});

When('se intenta subirlo como CV', async ({ request }) => {
  response = await request.post(`${API_URL}/upload`, {
    headers: { Authorization: `Bearer ${authToken}` },
    multipart: {
      file: { name: 'no-permitido.txt', mimeType: 'text/plain', buffer: Buffer.from('esto es texto plano') },
    },
  });
});

Then('el sistema rechaza la subida con un mensaje indicando que solo se admiten esos dos tipos', async () => {
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toContain('PDF and DOCX');
});

Given('un fichero de CV que supera los 10 MB', async ({ request }) => {
  authToken = await loginForToken(request);
});

When('se intenta subirlo', async ({ request }) => {
  // Magic number real (%PDF) + relleno hasta superar los 10MB del límite
  // (fileUploadService.ts, limits.fileSize) -- así el rechazo es de
  // verdad por tamaño, no porque el contenido no pase el chequeo de
  // magic number de security-hardening.
  const oversized = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(11 * 1024 * 1024)]);
  response = await request.post(`${API_URL}/upload`, {
    headers: { Authorization: `Bearer ${authToken}` },
    multipart: {
      file: { name: 'grande.pdf', mimeType: 'application/pdf', buffer: oversized },
    },
  });
});

Then('el sistema rechaza la subida', async () => {
  expect(response.status()).toBeGreaterThanOrEqual(400);
});

let uploadedFilePath: string;

Given('un fichero cuyo nombre original contiene segmentos como {string}', async ({ request }, segment: string) => {
  expect(segment).toBe('../');
  authToken = await loginForToken(request);
});

When('se sube ese fichero con ese nombre', async ({ request }) => {
  response = await request.post(`${API_URL}/upload`, {
    headers: { Authorization: `Bearer ${authToken}` },
    multipart: {
      file: { name: '../../etc/pwned.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%contenido real') },
    },
  });
});

Then('se guarda igualmente dentro del directorio de subidas, con un nombre que no contiene esos segmentos', async () => {
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.filePath).not.toContain('../');
  expect(path.dirname(body.filePath)).toBe(path.join(path.resolve(__dirname, '../../backend'), 'uploads'));
  expect(fs.existsSync(body.filePath)).toBe(true);
  fs.unlinkSync(body.filePath);
});

Given('el idioma activo de la interfaz es español', async ({ page }) => {
  await page.goto('/add-candidate');
  await expect(page.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
});

Given('el idioma activo de la interfaz es inglés', async ({ page }) => {
  await page.goto('/add-candidate');
  await page.getByRole('button', { name: 'English' }).click();
});

When('se muestra el selector de fichero del CV', async () => {
  // Ya está en pantalla desde el Given -- este paso solo deja constancia
  // de qué comprueba el Then, sin acción adicional.
});

Then('el botón de selección de fichero y el texto de estado se muestran en español', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Seleccionar archivo' })).toBeVisible();
  await expect(page.getByText('Ningún archivo seleccionado')).toBeVisible();
});

Then('el botón de selección de fichero y el texto de estado se muestran en inglés', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Browse…' })).toBeVisible();
  await expect(page.getByText('No file selected')).toBeVisible();
  await page.getByRole('button', { name: 'Español' }).click();
});
