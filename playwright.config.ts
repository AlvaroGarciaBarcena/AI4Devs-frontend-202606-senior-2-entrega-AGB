import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// Cada .feature se genera aquí a partir de los escenarios GIVEN/WHEN/THEN
// de openspec/specs/ (sección 3.24.2 de prompts-AGB.md) -- la trazabilidad
// va en el propio .feature, como comentario junto al Scenario, apuntando
// a la spec y al requisito de los que viene.
const testDir = defineBddConfig({
  features: 'e2e/features/*.feature',
  steps: 'e2e/steps/*.ts',
});

export default defineConfig({
  testDir,
  // En serie, a propósito: a diferencia de una suite de UI pura, estos
  // escenarios comparten estado real del lado del servidor (el límite de
  // intentos de login, la base de datos de desarrollo). Confirmado con PoC
  // manual: una vez agotado el limitador de login (10/15min), CUALQUIER
  // login real posterior falla -- por navegador o por API, da igual --
  // hasta que expira la ventana de 15 minutos. Por eso el escenario que
  // agota el limitador a propósito ("Muchos intentos seguidos") vive
  // aislado en su propio fichero, e2e/features/zz-rate-limiting.feature,
  // con un nombre que ordena el último alfabéticamente entre los ficheros
  // de test generados -- así ningún otro escenario que necesite un login
  // real se ejecuta después de él dentro de la misma tanda.
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    // El backend solo permite CORS desde este origen exacto (ver
    // security-hardening/candidate-intake en openspec/specs/) -- usar
    // otro puerto aquí rompería el login igual que rompió la demo de
    // code splitting con vite preview en el puerto por defecto.
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    // Sin esto, el contexto de Chromium por defecto de Playwright usa
    // locale inglés y la detección automática de idioma de la app
    // (internationalization/spec.md) renderiza en inglés -- el primer
    // intento de esta suite falló exactamente por esto, buscando
    // "Correo electrónico" en una pantalla que decía "Email".
    locale: 'es-ES',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
