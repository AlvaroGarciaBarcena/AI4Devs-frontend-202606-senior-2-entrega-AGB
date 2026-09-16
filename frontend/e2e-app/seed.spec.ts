import { test as base, expect } from '@playwright/test';

/**
 * Seed test para Playwright Test Agents (Planner, Generator, Healer).
 * Sirve como punto de anclaje para bootstrapear el entorno de la aplicación,
 * configurando los mocks deterministas y dejando el estado listo para que los
 * agentes exploren las funcionalidades (como el buscador de candidatos).
 */
export const test = base.extend({
  // Fixture reutilizable para preparar la posición con candidatos
  kanbanPage: async ({ page }, use) => {
    // Interceptar API de posición y candidatos para entorno reproducible
    await page.route('**/position/1/interviewflow', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          interviewFlow: {
            positionName: 'Frontend Engineer',
            interviewFlow: {
              interviewSteps: [
                { id: 1, name: 'Applied', orderIndex: 1 },
                { id: 2, name: 'Screening', orderIndex: 2 },
                { id: 3, name: 'Technical', orderIndex: 3 },
              ],
            },
          },
        }),
      });
    });

    await page.route('**/position/1/candidates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 101, applicationId: 10, fullName: 'José García', currentInterviewStep: 'Applied' },
          { id: 102, applicationId: 11, fullName: 'Alex Demo', currentInterviewStep: 'Screening' },
          { id: 103, applicationId: 12, fullName: 'María López', currentInterviewStep: 'Technical' },
        ]),
      });
    });

    await page.goto('/position/1');
    await expect(page.getByRole('heading', { level: 2, name: 'Frontend Engineer' })).toBeVisible();
    await use(page);
  },
});

test('seed: la aplicación kanban carga en estado determinista', async ({ kanbanPage }) => {
  await expect(kanbanPage.getByRole('searchbox', { name: 'Buscar candidatos' })).toBeVisible();
  await expect(kanbanPage.getByText('3 de 3 candidatos')).toBeVisible();
});
