import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

// La sesión ya viene dada por storageState (login real único de
// e2e/global-setup.ts, ver playwright.config.ts) -- no hace falta volver a
// iniciar sesión por navegador en cada escenario, solo navegar.

Given('existen posiciones reales en la base de datos', async () => {
  // Lo satisface el seed de la base de datos (backend/prisma/seed.ts):
  // "Senior Full-Stack Engineer" en LTI, Remote, Open, con fecha límite
  // 2024-12-31 -- el mismo dato que se comprueba en el Then.
});

When('un reclutador autenticado visita la pantalla de posiciones', async ({ page }) => {
  await page.goto('/positions');
});

Then('ve el título, la empresa, la ubicación, el estado y la fecha límite de una posición existente', async ({ page }) => {
  const card = page.locator('.card', { hasText: 'Senior Full-Stack Engineer' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('LTI');
  await expect(card).toContainText('Remote');
  await expect(card).toContainText('Abierto');
  await expect(card).toContainText('2024-12-31');
});

Given('el reclutador está en la pantalla de posiciones', async ({ page }) => {
  await page.goto('/positions');
  await expect(page.locator('.card', { hasText: 'Senior Full-Stack Engineer' })).toBeVisible();
});

When('pulsa "Ver proceso" sobre una posición', async ({ page }) => {
  const card = page.locator('.card', { hasText: 'Senior Full-Stack Engineer' });
  await card.getByRole('button', { name: 'Ver proceso' }).click();
});

Then('el sistema navega al tablero de esa posición concreta', async ({ page }) => {
  await expect(page).toHaveURL(/\/positions\/\d+$/);
  await expect(page.getByRole('heading', { name: /Proceso de selección.*Senior Full-Stack Engineer/ })).toBeVisible();
});

Given('existen varias posiciones con títulos distintos', async ({ page }) => {
  // Lo satisface el seed: "Senior Full-Stack Engineer" y "Data Scientist",
  // ambas en LTI/Remote/Open con la misma fecha límite -- solo el título
  // las distingue, así que basta para probar el filtro de texto.
  await page.goto('/positions');
  await expect(page.locator('.card', { hasText: 'Senior Full-Stack Engineer' })).toBeVisible();
  await expect(page.locator('.card', { hasText: 'Data Scientist' })).toBeVisible();
});

When('el reclutador escribe una parte del título de una de ellas en el buscador', async ({ page }) => {
  await page.getByLabel('Buscar por título').fill('Data Sci');
});

Then('solo se muestran las posiciones cuyo título contiene ese texto', async ({ page }) => {
  await expect(page.locator('.card', { hasText: 'Data Scientist' })).toBeVisible();
  await expect(page.locator('.card', { hasText: 'Senior Full-Stack Engineer' })).toHaveCount(0);
});

Given('existen posiciones, pero ninguna cumple el filtro de estado elegido', async ({ page }) => {
  // El seed no tiene ninguna posición "Closed" -- las dos existentes son
  // "Open".
  await page.goto('/positions');
  await expect(page.locator('.card', { hasText: 'Senior Full-Stack Engineer' })).toBeVisible();
});

When('el reclutador aplica ese filtro', async ({ page }) => {
  await page.getByLabel('Estado').selectOption({ label: 'Cerrado' });
});

Then('el sistema indica que ninguna posición coincide con los filtros', async ({ page }) => {
  await expect(page.getByText('Ninguna posición coincide con los filtros.')).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(0);
});
