import { test, expect } from '@playwright/test';

test.describe('E2E Frontend: Búsqueda de Candidatos en Kanban (AOM & Semántica)', () => {
  const mockInterviewFlow = {
    positionName: 'Frontend Engineer',
    interviewSteps: [
      { id: 1, name: 'Applied' },
      { id: 2, name: 'Screening' },
      { id: 3, name: 'Technical' },
    ],
  };

  const mockCandidates = [
    { id: 101, applicationId: 10, fullName: 'José García', currentInterviewStep: 'Applied' },
    { id: 102, applicationId: 11, fullName: 'Alex Demo', currentInterviewStep: 'Screening' },
    { id: 103, applicationId: 12, fullName: 'María López', currentInterviewStep: 'Technical' },
  ];

  test.beforeEach(async ({ page }) => {
    // Interceptamos llamadas API para garantizar determinismo y permitir ejecución aislada
    await page.route('**/position/1/interviewflow', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockInterviewFlow),
      });
    });

    await page.route('**/position/1/candidates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCandidates),
      });
    });

    // Navegar directamente al detalle del kanban de la posición
    await page.goto('/position/1');
  });

  test('BS-01 (AOM): Estado inicial, roles accesibles y conteo total', async ({ page }) => {
    // El agente interactúa mediante AOM (Accessibility Object Model)
    const searchbox = page.getByRole('searchbox', { name: 'Buscar candidatos' });
    const clearButton = page.getByRole('button', { name: 'Limpiar búsqueda' });
    const count = page.getByText('3 de 3 candidatos');

    await expect(searchbox).toBeVisible();
    await expect(searchbox).toHaveValue('');
    await expect(clearButton).toBeVisible();
    await expect(count).toBeVisible();

    // Las 3 tarjetas deben estar visibles en el DOM
    await expect(page.getByText('José García')).toBeVisible();
    await expect(page.getByText('Alex Demo')).toBeVisible();
    await expect(page.getByText('María López')).toBeVisible();
  });

  test('BS-01: Filtrado en tiempo real y actualización de conteo accesible', async ({ page }) => {
    const searchbox = page.getByRole('searchbox', { name: 'Buscar candidatos' });

    // Filtrar por término parcial
    await searchbox.fill('jose');

    // Conteo actualizado
    await expect(page.getByText('1 de 3 candidatos')).toBeVisible();

    // Sólo debe verse José García
    await expect(page.getByText('José García')).toBeVisible();
    await expect(page.getByText('Alex Demo')).toHaveCount(0);
    await expect(page.getByText('María López')).toHaveCount(0);
  });

  test('BS-02: Búsqueda sin coincidencias muestra mensaje de estado vacío', async ({ page }) => {
    const searchbox = page.getByRole('searchbox', { name: 'Buscar candidatos' });

    await searchbox.fill('Lucía');

    // Conteo a cero
    await expect(page.getByText('0 de 3 candidatos')).toBeVisible();

    // Mensaje de estado vacío amigable
    await expect(page.getByText('No hay candidatos que coincidan con la búsqueda.')).toBeVisible();

    // Ninguna tarjeta visible
    await expect(page.getByText('José García')).toHaveCount(0);
    await expect(page.getByText('Alex Demo')).toHaveCount(0);
    await expect(page.getByText('María López')).toHaveCount(0);
  });

  test('BS-03: Botón limpiar vacía la consulta, restaura candidatos y devuelve foco', async ({ page }) => {
    const searchbox = page.getByRole('searchbox', { name: 'Buscar candidatos' });
    const clearButton = page.getByRole('button', { name: 'Limpiar búsqueda' });

    await searchbox.fill('María');
    await expect(page.getByText('1 de 3 candidatos')).toBeVisible();

    // Clic en limpiar
    await clearButton.click();

    // Input vacío
    await expect(searchbox).toHaveValue('');

    // Foco devuelto al input (clave de accesibilidad y verificación con criterio)
    await expect(searchbox).toBeFocused();

    // Restauración de todas las candidaturas
    await expect(page.getByText('3 de 3 candidatos')).toBeVisible();
    await expect(page.getByText('José García')).toBeVisible();
    await expect(page.getByText('Alex Demo')).toBeVisible();
    await expect(page.getByText('María López')).toBeVisible();
  });

  test('BS-01 (Resiliencia): Insensibilidad a mayúsculas y acentos/tildes', async ({ page }) => {
    const searchbox = page.getByRole('searchbox', { name: 'Buscar candidatos' });

    // Mayúsculas y sin tilde sobre un nombre con tilde (GARCIA -> José García)
    await searchbox.fill('GARCIA');
    await expect(page.getByText('1 de 3 candidatos')).toBeVisible();
    await expect(page.getByText('José García')).toBeVisible();

    // Con tilde en minúscula
    await searchbox.fill('garcía');
    await expect(page.getByText('1 de 3 candidatos')).toBeVisible();
    await expect(page.getByText('José García')).toBeVisible();
  });
});
