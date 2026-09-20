import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { SEEDED_EMPLOYEE } from './support/seededEmployee';

const { Given, When, Then } = createBdd();

const API_URL = 'http://localhost:3010';

let lastResponse: { status: () => number };

Given('un mismo origen ya ha agotado el número de intentos de login permitidos en los últimos 15 minutos', async ({ request }) => {
  // El límite es 10/15min (index.ts, loginLimiter) -- se agotan con 10
  // intentos fallidos antes del "intento adicional" del WHEN.
  for (let i = 0; i < 10; i += 1) {
    await request.post(`${API_URL}/auth/login`, {
      // NOSONAR (typescript:S2068): no es una contraseña real filtrada, es
      // un valor deliberadamente incorrecto para forzar el fallo de login
      // que agota el limitador -- el propio análisis estático no puede
      // distinguir "credencial real" de "texto que a propósito no lo es".
      data: { email: SEEDED_EMPLOYEE.email, password: 'contraseña-incorrecta' }, // NOSONAR
    });
  }
});

When('ese origen realiza un intento adicional de inicio de sesión', async ({ request }) => {
  lastResponse = await request.post(`${API_URL}/auth/login`, {
    data: { email: SEEDED_EMPLOYEE.email, password: SEEDED_EMPLOYEE.password },
  });
});

Then('el sistema rechaza el intento con un código de límite de peticiones alcanzado', async () => {
  expect(lastResponse.status()).toBe(429);
});
