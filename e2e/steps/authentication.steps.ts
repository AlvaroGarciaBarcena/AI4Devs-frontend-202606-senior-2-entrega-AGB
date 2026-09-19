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
