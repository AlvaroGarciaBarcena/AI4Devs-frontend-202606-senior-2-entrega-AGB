import { createBdd } from 'playwright-bdd';
import { expect, Page, BrowserContext } from '@playwright/test';

const { Given, When, Then } = createBdd();

let freshContext: BrowserContext;
let freshPage: Page;

Given('el navegador tiene configurada una lista de idiomas en la que el español no es el primero pero sí aparece en la lista', async ({ browser }) => {
  // browser.newContext() sin overrides hereda el storageState del
  // proyecto (el login real de globalSetup) -- hay que pasar
  // storageState: undefined explícitamente para partir de verdad sin
  // sesión ni lti_error_locale guardado, que es lo que este escenario
  // necesita ("sin ninguna elección de idioma guardada"). i18next-
  // browser-languagedetector lee navigator.languages completo (no solo
  // el primero), que es exactamente el requisito bajo prueba.
  freshContext = await browser.newContext({ storageState: undefined });
  freshPage = await freshContext.newPage();
  // Francés primero a propósito: la app solo soporta es/en
  // (supportedLngs en i18n.js), así que un francés en primer lugar no
  // sirve para nada -- justo lo que hace falta para probar "no solo el
  // primero" de verdad. Un inglés en primer lugar habría sido un mal
  // fixture: inglés SÍ está soportado, así que un detector que solo mira
  // el primero de la lista lo habría elegido igualmente, sin que el test
  // pudiera distinguir "mira toda la lista" de "solo mira el primero"
  // (hallazgo real de esta propia sesión: el primer intento usaba
  // ['en-US', 'es-ES', 'fr-FR'] y el navegador, correctamente, detectaba
  // inglés -- no era un fallo de la app, era un fixture mal elegido).
  await freshPage.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', { value: ['fr-FR', 'es-ES', 'en-US'], configurable: true });
    Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });
  });
});

When('se carga la aplicación por primera vez, sin ninguna elección de idioma guardada', async () => {
  await freshPage.goto('/login');
});

Then('el sistema detecta español como idioma inicial', async () => {
  await expect(freshPage.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await freshContext.close();
});

Given('la interfaz está mostrando español', async ({ page }) => {
  await page.goto('/positions');
  await expect(page.getByRole('heading', { name: 'Posiciones' })).toBeVisible();
});

When('el usuario pulsa el botón "English" del selector', async ({ page }) => {
  await page.getByRole('button', { name: 'English' }).click();
});

Then('toda la interfaz cambia a inglés de inmediato, y ese idioma se mantiene en visitas posteriores', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Positions' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Positions' })).toBeVisible();
  // Se deja en español otra vez, para no afectar al resto de escenarios
  // de esta misma sesión de navegador (storageState/localStorage
  // compartido entre pasos dentro del mismo test, pero cada test parte
  // de un contexto fresco -- aun así, dejarlo limpio es más honesto).
  await page.getByRole('button', { name: 'Español' }).click();
});

Given('un formulario con datos ya escritos por el usuario', async ({ page }) => {
  await page.goto('/add-candidate');
  await page.getByLabel('Nombre').fill('Nombre De Prueba');
});

When('el usuario cambia el idioma activo', async ({ page }) => {
  await page.getByRole('button', { name: 'English' }).click();
});

Then('las etiquetas y botones cambian de idioma sin que se pierdan los datos ya introducidos', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Add Candidate' })).toBeVisible();
  await expect(page.getByLabel('First Name')).toHaveValue('Nombre De Prueba');
  await page.getByRole('button', { name: 'Español' }).click();
});

let candidatesRequestCountAfterFailedSubmit = 0;

Given('un envío fallido muestra un mensaje de error en español', async ({ page }) => {
  await page.goto('/add-candidate');
  // Mismo truco que en candidate-intake: pasa el `required` nativo (no
  // está vacío) pero falla la validación del backend (solo letras y
  // espacios en el nombre), así que produce un error de campo real.
  await page.getByLabel('Nombre').fill('Poc2');
  await page.getByLabel('Apellido').fill('Apellido');
  await page.getByLabel('Correo Electrónico').fill(`e2e-i18n-error-${Date.now()}@example.com`);
  await page.getByLabel('Posición a la que se presenta').selectOption({ label: 'Senior Full-Stack Engineer — LTI' });
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('El nombre contiene un carácter no permitido: "2"').first()).toBeVisible();

  // Se cuenta a partir de aquí, después del único envío real que sí debe
  // haber pasado -- el Then comprueba que cambiar de idioma no dispara
  // ninguno más.
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/candidates')) {
      candidatesRequestCountAfterFailedSubmit += 1;
    }
  });
});

When('el usuario cambia el idioma a inglés sin corregir nada', async ({ page }) => {
  await page.getByRole('button', { name: 'English' }).click();
});

Then('el mismo mensaje de error se muestra en inglés, sin que el formulario se haya reenviado', async ({ page }) => {
  await expect(page.getByText('The first name contains a character that is not allowed: "2"').first()).toBeVisible();
  expect(candidatesRequestCountAfterFailedSubmit).toBe(0);
  await page.getByRole('button', { name: 'Español' }).click();
});
