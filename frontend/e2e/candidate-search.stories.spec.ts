import { test, expect } from '@playwright/test';

const storyMolecule = (id: string) => `/iframe.html?id=lidr-molecules-candidatesearch--${id}&viewMode=story`;
const storyOrganism = (id: string) => `/iframe.html?id=lidr-organisms-positionkanbandetail--${id}&viewMode=story`;

test.describe('E2E Storybook: Molécula y Organismo de Búsqueda (Atomic Design E2E)', () => {
  test('Molécula aislada: Ready presenta roles accesibles y conteo', async ({ page }) => {
    await page.goto(storyMolecule('ready'));
    const input = page.getByRole('searchbox', { name: 'Buscar candidatos' });
    const button = page.getByRole('button', { name: 'Limpiar búsqueda' });

    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');
    await expect(button).toBeVisible();
    await expect(page.getByText('3 de 3 candidatos')).toBeVisible();
  });

  test('Molécula aislada: Limpiar emite consulta vacía y recupera foco', async ({ page }) => {
    await page.goto(storyMolecule('match'));
    const input = page.getByRole('searchbox', { name: 'Buscar candidatos' });
    const button = page.getByRole('button', { name: 'Limpiar búsqueda' });

    await expect(input).toHaveValue('jose');
    await button.click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });

  test('Molécula aislada: Estado Saving deshabilita input y botón de limpiar', async ({ page }) => {
    await page.goto(storyMolecule('saving'));
    const input = page.getByRole('searchbox', { name: 'Buscar candidatos' });
    const button = page.getByRole('button', { name: 'Limpiar búsqueda' });

    await expect(input).toBeDisabled();
    await expect(button).toBeDisabled();
  });

  test('Organismo integrado: Búsqueda y filtrado dinámico en Kanban', async ({ page }) => {
    await page.goto(storyOrganism('search-match'));
    const input = page.getByRole('searchbox', { name: 'Buscar candidatos' });

    await expect(page.getByText('1 de 3 candidatos')).toBeVisible();
    await expect(page.getByText('José García')).toBeVisible();
    await expect(page.getByText('Alex Demo')).toHaveCount(0);

    // Búsqueda sin coincidencias
    await input.fill('Desconocido');
    await expect(page.getByText('No hay candidatos que coincidan con la búsqueda.')).toBeVisible();

    // Limpiar restaura tablero
    await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
    await expect(page.getByText('3 de 3 candidatos')).toBeVisible();
    await expect(page.getByText('Alex Demo')).toBeVisible();
  });
});
