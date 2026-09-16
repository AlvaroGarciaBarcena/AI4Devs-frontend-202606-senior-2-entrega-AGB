import { test, expect } from './midscene.fixture';

/**
 * Ejemplo de Test E2E impulsado por Midscene.js
 * Utiliza visión por computadora e IA (Gemini Flash) para interactuar y validar la UI
 * en lenguaje natural, sin depender de selectores CSS frágiles.
 */
test.describe('E2E Kanban con Midscene AI (Vision-Driven Testing)', () => {
  const mockInterviewFlow = {
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
  };

  const mockCandidates = [
    { id: 101, applicationId: 10, fullName: 'José García', currentInterviewStep: 'Applied' },
    { id: 102, applicationId: 11, fullName: 'Alex Demo', currentInterviewStep: 'Screening' },
    { id: 103, applicationId: 12, fullName: 'María López', currentInterviewStep: 'Technical' },
  ];

  test.beforeEach(async ({ page }) => {
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

    await page.goto('/position/1');
  });

  test('Búsqueda visual y aserciones en lenguaje natural con Midscene', async ({
    aiWaitFor,
    aiAssert,
    aiInput,
    aiTap,
    aiQuery,
  }) => {
    // 1. Espera visual inteligente
    await aiWaitFor('el tablero de candidatos esté cargado y visible');

    // 2. Aserción visual del estado inicial
    await aiAssert('aparecen 3 tarjetas de candidatos en el tablero');

    // 3. Acción visual en lenguaje natural (localiza el input por apariencia/contexto)
    await aiInput('José', 'campo de búsqueda de candidatos');

    // 4. Aserción sobre el resultado filtrado
    await aiAssert('solo se muestra la tarjeta de José García y el indicador muestra 1 de 3');

    // 5. Extracción de datos estructurados de la interfaz vía IA
    const visibleNames = await aiQuery<string[]>(
      'extrae la lista de nombres de candidatos visibles actualmente en el tablero como array de strings'
    );
    expect(visibleNames).toContain('José García');

    // 6. Clic visual para limpiar la búsqueda
    await aiTap('botón para limpiar la búsqueda');

    // 7. Aserción tras limpiar
    await aiAssert('vuelven a mostrarse los 3 candidatos y el campo de búsqueda está vacío');
  });
});
