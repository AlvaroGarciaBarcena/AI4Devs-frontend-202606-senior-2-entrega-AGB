import path from 'path';
import dotenv from 'dotenv';
import { PlaywrightAiFixture } from '@midscene/web/playwright';
import { test as base } from '@playwright/test';

// Cargar variables de entorno desde frontend/.env o el .env raíz
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Asegurar configuración del modelo Midscene (fallback robusto)
process.env.MIDSCENE_MODEL_BASE_URL =
  process.env.MIDSCENE_MODEL_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/';
process.env.MIDSCENE_MODEL_API_KEY =
  process.env.MIDSCENE_MODEL_API_KEY || 'AIzaSyBjDgfpKouCSo_sgjQXUnAx6cHO7A4iy7Y';
process.env.MIDSCENE_MODEL_NAME =
  process.env.MIDSCENE_MODEL_NAME || 'gemini-3.5-flash';
process.env.MIDSCENE_MODEL_FAMILY =
  process.env.MIDSCENE_MODEL_FAMILY || 'gemini';
process.env.MIDSCENE_PREFERRED_LANGUAGE =
  process.env.MIDSCENE_PREFERRED_LANGUAGE || 'Spanish';

/**
 * Fixture de Playwright con capacidades de IA de Midscene.
 * Expone métodos visuales e impulsados por IA directamente en los tests:
 * - ai(prompt): Ejecuta acciones y aserciones inteligentes
 * - aiAct(actionDescription): Realiza acciones en lenguaje natural
 * - aiTap(target): Clic visual sobre un elemento
 * - aiInput(text, target): Escribe texto en un campo identificado visualmente
 * - aiAssert(assertionDescription): Verifica condiciones visuales en pantalla
 * - aiWaitFor(condition): Espera a que se cumpla una condición visual
 * - aiQuery(queryDescription): Extrae datos estructurados de la interfaz
 */
export const test = base.extend(PlaywrightAiFixture());
export { expect } from '@playwright/test';
