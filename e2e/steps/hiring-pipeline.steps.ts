import { createBdd } from 'playwright-bdd';
import { expect, Page } from '@playwright/test';
import { prisma } from './support/prisma';

const { Given, When, Then } = createBdd();

let tempPositionId: number;
let tempFilledStepName: string;
let tempEmptyStepName: string;
let tempCandidateId: number;
let lastCandidateEmail: string;

const openBoard = async (page: Page, positionTitle: string) => {
  await page.goto('/positions');
  await page.locator('.card', { hasText: positionTitle }).getByRole('button', { name: 'Ver proceso' }).click();
  await expect(page).toHaveURL(/\/positions\/\d+$/);
};

Given('una posición tiene candidatos en más de una fase de su proceso', async () => {
  // Lo satisface el seed de la base de datos (backend/prisma/seed.ts):
  // "Senior Full-Stack Engineer" tiene a Carlos García en "Initial
  // Screening" y a John Doe + Jane Smith en "Technical Interview".
});

When('un reclutador visita el tablero "Ver proceso" de esa posición', async ({ page }) => {
  await openBoard(page, 'Senior Full-Stack Engineer');
});

Then('el tablero los agrupa en una columna por fase, mostrando el nombre y la puntuación media de cada uno', async ({ page }) => {
  const initialScreening = page.locator('.border.rounded', { has: page.getByRole('heading', { name: 'Initial Screening' }) });
  await expect(initialScreening.getByText('Carlos García')).toBeVisible();
  await expect(initialScreening.getByText('Puntuación media: 0.0')).toBeVisible();

  const technicalInterview = page.locator('.border.rounded', { has: page.getByRole('heading', { name: 'Technical Interview' }) });
  await expect(technicalInterview.getByText('John Doe')).toBeVisible();
  await expect(technicalInterview.getByText('Puntuación media: 5.0')).toBeVisible();
  await expect(technicalInterview.getByText('Jane Smith')).toBeVisible();
  await expect(technicalInterview.getByText('Puntuación media: 4.0')).toBeVisible();
});

Given('una fase del proceso de una posición no tiene ningún candidato todavía', async () => {
  // Posición autocontenida creada por Prisma (no depende del seed): dos
  // fases, una con un candidato y otra deliberadamente vacía -- más claro
  // y determinista que depender de qué fases del seed real estén vacías
  // hoy, que puede cambiar con el propio seed.
  const company = await prisma.company.findFirst();
  const flow = await prisma.interviewFlow.create({ data: { description: 'E2E: fase vacía (hiring-pipeline)' } });
  const interviewType = await prisma.interviewType.findFirst();
  tempFilledStepName = `E2E Fase Con Candidatos ${Date.now()}`;
  tempEmptyStepName = `E2E Fase Vacía ${Date.now()}`;
  const filledStep = await prisma.interviewStep.create({
    data: { interviewFlowId: flow.id, interviewTypeId: interviewType.id, name: tempFilledStepName, orderIndex: 1 },
  });
  await prisma.interviewStep.create({
    data: { interviewFlowId: flow.id, interviewTypeId: interviewType.id, name: tempEmptyStepName, orderIndex: 2 },
  });
  const position = await prisma.position.create({
    data: {
      title: `E2E Posición Fase Vacía ${Date.now()}`,
      description: 'Fixture de prueba E2E', status: 'Open', isVisible: true, location: 'Remote',
      jobDescription: 'x', companyId: company.id, interviewFlowId: flow.id,
      salaryMin: 1, salaryMax: 2, employmentType: 'Full-time', benefits: 'x', contactInfo: 'x',
      requirements: 'x', responsibilities: 'x', companyDescription: 'x', applicationDeadline: new Date('2030-01-01'),
    },
  });
  tempPositionId = position.id;

  const candidate = await prisma.candidate.create({
    data: { firstName: 'Fixture', lastName: 'ConCandidato', email: `e2e-fase-vacia-${Date.now()}@example.com` },
  });
  tempCandidateId = candidate.id;
  await prisma.application.create({
    data: { positionId: position.id, candidateId: candidate.id, applicationDate: new Date(), currentInterviewStep: filledStep.id },
  });
});

Then('esa columna se muestra vacía con una indicación de que no hay candidatos en esa fase', async ({ page }) => {
  await page.goto(`/positions/${tempPositionId}`);
  const emptyColumn = page.locator('.border.rounded', { has: page.getByRole('heading', { name: tempEmptyStepName }) });
  await expect(emptyColumn.getByText('Sin candidatos en esta fase.')).toBeVisible();
  const filledColumn = page.locator('.border.rounded', { has: page.getByRole('heading', { name: tempFilledStepName }) });
  await expect(filledColumn.getByText('Fixture ConCandidato')).toBeVisible();

  // Por id exacto, no por `email: { contains: 'e2e-fase-vacia-' } }`: ese
  // filtro amplio borraba (o, peor, fallaba al intentar borrar) cualquier
  // candidato de una ejecución anterior interrumpida que compartiera el
  // mismo prefijo de email, aunque perteneciera a una posición ya
  // borrada -- hallazgo real: una ejecución previa cortada a medias (por
  // el limitador de intentos de login, no por este escenario) dejó un
  // candidato así, y el `deleteMany` amplio de la siguiente ejecución
  // chocó con la restricción RESTRICT de Application → Candidate al
  // intentar arrastrarlo también.
  await prisma.application.deleteMany({ where: { positionId: tempPositionId } });
  await prisma.candidate.delete({ where: { id: tempCandidateId } });
  const position = await prisma.position.findUnique({ where: { id: tempPositionId } });
  await prisma.position.delete({ where: { id: tempPositionId } });
  // InterviewStep -> InterviewFlow es RESTRICT: hay que borrar las fases
  // antes de poder borrar el propio flujo.
  await prisma.interviewStep.deleteMany({ where: { interviewFlowId: position.interviewFlowId } });
  await prisma.interviewFlow.delete({ where: { id: position.interviewFlowId } });
});

Given('una posición con su flujo de entrevistas configurado', async () => {
  // Lo satisface el seed: "Senior Full-Stack Engineer" (interviewFlow1).
});

When('se da de alta un candidato eligiendo esa posición', async ({ page }) => {
  lastCandidateEmail = `e2e-hiring-pipeline-${Date.now()}@example.com`;
  await page.goto('/add-candidate');
  await page.getByLabel('Posición a la que se presenta').selectOption({ label: 'Senior Full-Stack Engineer — LTI' });
  await page.getByLabel('Nombre').fill('Nuevo');
  await page.getByLabel('Apellido').fill('Candidato');
  await page.getByLabel('Correo Electrónico').fill(lastCandidateEmail);
  await page.getByRole('button', { name: 'Enviar' }).click();
  // getByRole('status') a secas ya no basta: NavigationLoadingIndicator
  // (frontend/src/components/) es un segundo role="status" permanente en
  // el DOM, hace falta filtrar por el texto del mensaje de éxito.
  await expect(page.getByRole('status').filter({ hasText: 'Candidato añadido con éxito' })).toHaveText('Candidato añadido con éxito');
});

Then('ese candidato aparece de inmediato en la primera columna del tablero de esa posición, con puntuación media de 0', async ({ page }) => {
  await openBoard(page, 'Senior Full-Stack Engineer');
  const firstPhaseColumn = page.locator('.border.rounded', { has: page.getByRole('heading', { name: 'Initial Screening' }) });
  const newCandidateCard = firstPhaseColumn.locator('.card', { hasText: 'Nuevo Candidato' });
  await expect(newCandidateCard).toBeVisible();
  await expect(newCandidateCard.getByText('Puntuación media: 0.0')).toBeVisible();

  const candidate = await prisma.candidate.findFirst({ where: { email: lastCandidateEmail } });
  await prisma.application.deleteMany({ where: { candidateId: candidate.id } });
  await prisma.candidate.delete({ where: { id: candidate.id } });
});

let tempUnassignedEmail: string;

Given('existen candidatos dados de alta sin elegir posición', async () => {
  tempUnassignedEmail = `e2e-sin-asignar-${Date.now()}@example.com`;
  await prisma.candidate.create({
    data: { firstName: 'E2E', lastName: 'SinAsignar', email: tempUnassignedEmail },
  });
});

When('un reclutador visita el listado de candidatos sin asignar', async ({ page }) => {
  await page.goto('/candidates/unassigned');
  await expect(page.getByRole('heading', { name: 'Candidatos sin asignar' })).toBeVisible();
});

Then('ve a cada uno de ellos con su nombre completo, email y fecha de alta, el más reciente primero', async ({ page }) => {
  await expect(page.getByRole('cell', { name: 'E2E SinAsignar' })).toBeVisible();
  await expect(page.getByRole('cell', { name: tempUnassignedEmail })).toBeVisible();

  await prisma.candidate.deleteMany({ where: { email: tempUnassignedEmail } });
});

Given('no existe ningún candidato sin candidatura', async () => {
  // Deja la base de datos realmente vacía de candidatos sin asignar --
  // incluye residuos previos (p. ej. de pruebas manuales), no solo los que
  // haya podido crear este propio escenario.
  await prisma.candidate.deleteMany({ where: { applications: { none: {} } } });
});

Then('ve una indicación de que no hay ninguno', async ({ page }) => {
  await expect(page.getByText('No hay ningún candidato sin asignar.')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});
