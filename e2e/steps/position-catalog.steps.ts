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
