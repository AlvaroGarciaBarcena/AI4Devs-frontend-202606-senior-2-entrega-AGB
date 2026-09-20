import { createBdd } from 'playwright-bdd';
import { expect, Page, BrowserContext } from '@playwright/test';

const { Given, When, Then } = createBdd();

// En modo dev de Vite, cada componente con code splitting (React.lazy) se
// sirve como su propio módulo bajo demanda -- justo lo que hace falta para
// observar "se descargó" / "no se descargó" de verdad: una petición de red
// real a la ruta de su fichero fuente, no una suposición sobre el bundle.
const CHUNK_URL_PATTERNS: Record<string, RegExp> = {
  RecruiterDashboard: /RecruiterDashboard/,
  AddCandidateForm: /AddCandidateForm/,
  Positions: /components\/Positions/,
  PositionProcess: /PositionProcess/,
};

let freshContext: BrowserContext;
let freshPage: Page;
let requestedUrls: string[];

const trackRequests = (page: Page) => {
  requestedUrls = [];
  page.on('request', (request) => requestedUrls.push(request.url()));
};

Given('alguien sin sesión iniciada', async ({ browser }) => {
  // browser.newContext() SIN overrides hereda el storageState configurado
  // a nivel de proyecto en playwright.config.ts (el login real de
  // globalSetup) -- hay que pasar storageState: undefined explícitamente
  // para partir de verdad sin sesión (hallazgo real: sin este override, la
  // página raíz mostraba el Dashboard del Reclutador ya autenticado, no
  // el login).
  freshContext = await browser.newContext({ storageState: undefined });
  freshPage = await freshContext.newPage();
  trackRequests(freshPage);
});

When('visita la aplicación por primera vez', async () => {
  await freshPage.goto('/');
  await expect(freshPage).toHaveURL(/\/login$/);
});

Then('el código de las pantallas protegidas no se descarga', async () => {
  for (const [name, pattern] of Object.entries(CHUNK_URL_PATTERNS)) {
    expect(requestedUrls.some((url) => pattern.test(url)), `no debería haberse pedido el código de ${name}`).toBe(false);
  }
  await freshContext.close();
});

Given('un usuario autenticado que nunca ha visitado la pantalla de alta de candidato en esa sesión', async ({ page }) => {
  trackRequests(page);
  await page.goto('/');
});

When('visita el listado de posiciones', async ({ page }) => {
  await page.goto('/positions');
  await expect(page.getByRole('heading', { name: 'Posiciones' })).toBeVisible();
});

Then('el código de la pantalla de alta de candidato no llega a descargarse en esa sesión', async () => {
  expect(requestedUrls.some((url) => CHUNK_URL_PATTERNS.AddCandidateForm.test(url))).toBe(false);
});

// Corregido: el hallazgo real de esta sesión (el Suspense fallback nunca
// se mostraba durante una navegación por <Link>, ver prompts-AGB.md
// sección 3.30.4) se resolvió migrando App.jsx de <BrowserRouter>/<Routes>
// a createBrowserRouter -- las 4 rutas protegidas ahora usan `lazy` a
// nivel de ruta en vez de React.lazy()+<Suspense> a mano, así que el
// propio router sabe cuándo una navegación sigue esperando el código de
// la pantalla destino (useNavigation().state), y
// <NavigationLoadingIndicator> (frontend/src/components/) lo refleja.
//
// Se retrasa a propósito, con page.route(), la petición del chunk de
// AddCandidateForm.jsx 800ms -- muy por encima de los delayMs=150 del
// propio indicador -- para comprobar que aparece de verdad durante la
// espera, no solo que la pantalla nueva acaba llegando.

Given('un usuario autenticado está en una pantalla cuyo código ya se descargó', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard del Reclutador' })).toBeVisible();
});

When('navega por primera vez a otra pantalla protegida cuyo código aún no se ha descargado', async ({ page }) => {
  await page.route(/AddCandidateForm/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await page.getByRole('link', { name: 'Añadir Nuevo Candidato' }).click();
});

Then('ve una indicación de carga hasta que la pantalla está lista para mostrarse', async ({ page }) => {
  // getByRole('status', { name: ... }) no resolvía este elemento de forma
  // fiable pese a que su nombre accesible era correcto de verdad
  // (confirmado con ariaSnapshot() durante la depuración) -- probable
  // manejo especial/con retraso de Chromium para regiones aria-live en su
  // árbol de accesibilidad, que getByRole(..., {name}) no siempre ve a
  // tiempo. Se localiza por el propio atributo role y se comprueba el
  // texto del hijo directamente, sin depender del cómputo del nombre
  // accesible.
  const indicator = page.locator('[role="status"]');
  await expect(indicator).toContainText('Cargando página…');
  await expect(page.getByRole('heading', { name: 'Agregar Candidato' })).toBeVisible();
  await expect(indicator).not.toContainText('Cargando página…');
});
