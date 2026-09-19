import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { prisma } from './support/prisma';

const { Given, When, Then } = createBdd();

let lastCandidateEmail: string;

Given('la interfaz está mostrando cualquiera de los dos idiomas soportados', async ({ page }) => {
  await page.goto('/positions');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

When('el usuario cambia el idioma activo de la interfaz', async ({ page }) => {
  await page.getByRole('button', { name: 'English' }).click();
});

Then('el atributo de idioma de la página se actualiza al nuevo idioma sin recargar', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Español' }).click();
});

Given('el formulario de alta de candidato contiene datos que no pasarán la validación', async ({ page }) => {
  await page.goto('/add-candidate');
  // Mismo truco que en candidate-intake/internationalization: pasa el
  // `required` nativo pero falla la validación del backend.
  await page.getByLabel('Nombre').fill('Poc2');
  await page.getByLabel('Apellido').fill('Apellido');
  await page.getByLabel('Correo Electrónico').fill(`e2e-a11y-error-${Date.now()}@example.com`);
  await page.getByLabel('Posición a la que se presenta').selectOption({ label: 'Senior Full-Stack Engineer — LTI' });
});

When('un envío del formulario falla por validación', async ({ page }) => {
  await page.getByRole('button', { name: 'Enviar' }).click();
});

Then('el resumen de errores se anuncia de inmediato a un lector de pantalla como una alerta', async ({ page }) => {
  // role="alert" + aria-live="assertive": un lector de pantalla lo
  // anuncia en cuanto aparece, sin que el foco tenga que moverse hasta
  // él -- WCAG 2.1, criterio 4.1.3.
  const summary = page.getByRole('alert').first();
  await expect(summary).toBeVisible();
  await expect(summary).toHaveAttribute('aria-live', 'assertive');
  await expect(summary).toContainText('El nombre contiene un carácter no permitido');
});

Given('el formulario de alta de candidato contiene datos válidos, incluida una posición elegida', async ({ page }) => {
  await page.goto('/add-candidate');
  lastCandidateEmail = `e2e-a11y-exito-${Date.now()}@example.com`;
  await page.getByLabel('Nombre').fill('Ana');
  await page.getByLabel('Apellido').fill('Valida');
  await page.getByLabel('Correo Electrónico').fill(lastCandidateEmail);
  await page.getByLabel('Posición a la que se presenta').selectOption({ label: 'Senior Full-Stack Engineer — LTI' });
});

When('un alta de candidato se completa con éxito', async ({ page }) => {
  await page.getByRole('button', { name: 'Enviar' }).click();
});

Then('el mensaje de éxito se anuncia de forma no intrusiva', async ({ page }) => {
  // role="status" + aria-live="polite": se anuncia sin interrumpir lo
  // que el lector de pantalla estuviera leyendo -- a diferencia del
  // resumen de errores (role="alert"/"assertive"), que sí interrumpe.
  const success = page.getByRole('status');
  await expect(success).toHaveText('Candidato añadido con éxito');
  await expect(success).toHaveAttribute('aria-live', 'polite');

  const candidate = await prisma.candidate.findFirst({ where: { email: lastCandidateEmail } });
  await prisma.application.deleteMany({ where: { candidateId: candidate.id } });
  await prisma.candidate.delete({ where: { id: candidate.id } });
});

Given('un envío del formulario ha fallado la validación de al menos un campo', async ({ page }) => {
  await page.goto('/add-candidate');
  await page.getByLabel('Nombre').fill('Poc2');
  await page.getByLabel('Apellido').fill('Apellido');
  await page.getByLabel('Correo Electrónico').fill(`e2e-a11y-campo-${Date.now()}@example.com`);
  await page.getByLabel('Posición a la que se presenta').selectOption({ label: 'Senior Full-Stack Engineer — LTI' });
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'true');
});

When('un campo del formulario tiene un error de validación', async () => {
  // Ya provocado en el Given -- este paso solo deja constancia de que el
  // Then comprueba justo ese campo, "Nombre".
});

Then('ese campo queda marcado como inválido y referencia el elemento que contiene su mensaje de error específico', async ({ page }) => {
  const field = page.getByLabel('Nombre');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  const describedBy = await field.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  const referencedMessage = page.locator(`#${describedBy}`);
  await expect(referencedMessage).toBeVisible();
  await expect(referencedMessage).toContainText('El nombre contiene un carácter no permitido');
});

Given('el selector de idioma está visible con uno de los dos idiomas activo', async ({ page }) => {
  await page.goto('/positions');
  await expect(page.getByRole('button', { name: 'Español' })).toBeVisible();
});

When('un lector de pantalla recorre el selector de idioma', async () => {
  // No hay nada que "hacer" -- un lector de pantalla real solo lee los
  // atributos ya presentes en el DOM, que es justo lo que comprueba el
  // Then de abajo.
});

Then('anuncia cuál de las dos opciones está actualmente seleccionada', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false');
});
