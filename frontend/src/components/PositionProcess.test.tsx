import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PositionProcess from './PositionProcess';
import { getCandidatesByPosition, getInterviewFlowByPosition } from '../services/positionService';
import { updateCandidateStage } from '../services/candidateService';
import i18n from '../i18n/i18n';

vi.mock('../services/positionService', () => ({
    getCandidatesByPosition: vi.fn(),
    getInterviewFlowByPosition: vi.fn(),
}));

vi.mock('../services/candidateService', () => ({
    updateCandidateStage: vi.fn(),
}));

beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('es');
});

const flow = {
    positionName: 'Full Stack Developer',
    interviewFlow: {
        id: 1,
        description: null,
        interviewSteps: [
            { id: 1, name: 'Initial Screening', orderIndex: 1 },
            { id: 2, name: 'Technical Interview', orderIndex: 2 },
        ],
    },
};

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/positions/1/process']}>
            <Routes>
                <Route path="/positions/:id/process" element={<PositionProcess />} />
            </Routes>
        </MemoryRouter>,
    );

describe('PositionProcess — nombres de fase traducidos', () => {
    // Pedido por el usuario: la interfaz está en español pero los nombres de
    // fase venían tal cual de la base de datos, en inglés (p. ej. "Initial
    // Screening"). El filtrado de candidatos por fase debe seguir
    // comparando contra el nombre crudo -- solo cambia lo que se muestra.
    it('shows known interview step names translated, without breaking the candidate-to-column match', async () => {
        vi.mocked(getInterviewFlowByPosition).mockResolvedValue(flow);
        vi.mocked(getCandidatesByPosition).mockResolvedValue([
            { id: 5, applicationId: 50, fullName: 'Ana Ejemplo', currentInterviewStep: 'Initial Screening', averageScore: 4 },
        ]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Selección inicial' })).toBeTruthy();
        });
        expect(screen.getByRole('heading', { name: 'Entrevista técnica' })).toBeTruthy();
        expect(screen.queryByRole('heading', { name: 'Initial Screening' })).toBeNull();
        // La candidata sigue apareciendo bajo su fase real -- la traducción
        // del título no rompió el emparejamiento candidato/columna.
        expect(screen.getByText('Ana Ejemplo')).toBeTruthy();
    });

    it('falls back to the raw step name for a step with no known translation', async () => {
        vi.mocked(getInterviewFlowByPosition).mockResolvedValue({
            ...flow,
            interviewFlow: {
                ...flow.interviewFlow,
                interviewSteps: [{ id: 9, name: 'Culture Fit Chat', orderIndex: 1 }],
            },
        });
        vi.mocked(getCandidatesByPosition).mockResolvedValue([]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Culture Fit Chat' })).toBeTruthy();
        });
    });
});

// Pedido por el usuario: poder mover la ficha de un candidato de una fase a
// otra. El selector por tarjeta es la vía accesible por teclado/lector de
// pantalla/táctil (probada aquí); el arrastrar-y-soltar nativo es solo un
// atajo de ratón encima del mismo `updateCandidateStage` (no se puede
// simular con jsdom de forma realista, así que no tiene test propio aquí).
describe('PositionProcess — mover un candidato a otra fase', () => {
    const candidate = { id: 5, applicationId: 50, fullName: 'Ana Ejemplo', currentInterviewStep: 'Initial Screening', averageScore: 4 };

    it('moves the candidate to the selected stage and calls the backend with the target step id', async () => {
        const user = userEvent.setup();
        vi.mocked(getInterviewFlowByPosition).mockResolvedValue(flow);
        vi.mocked(getCandidatesByPosition).mockResolvedValue([candidate]);
        vi.mocked(updateCandidateStage).mockResolvedValue({ message: 'ok', data: {} });

        renderPage();

        const select = await screen.findByRole('combobox', { name: 'Mover a Ana Ejemplo a otra fase' });
        await user.selectOptions(select, 'Technical Interview');

        expect(updateCandidateStage).toHaveBeenCalledWith(5, 50, 2);
        await waitFor(() => {
            expect(within(screen.getByRole('heading', { name: 'Entrevista técnica' }).closest('.mb-4') as HTMLElement).getByText('Ana Ejemplo')).toBeTruthy();
        });
    });

    it('rolls back the optimistic move and shows an error when the backend rejects it', async () => {
        const user = userEvent.setup();
        vi.mocked(getInterviewFlowByPosition).mockResolvedValue(flow);
        vi.mocked(getCandidatesByPosition).mockResolvedValue([candidate]);
        // El servicio real siempre lanza un Error (ver candidateService.js) --
        // aquí se reproduce esa forma, no la respuesta cruda de axios.
        vi.mocked(updateCandidateStage).mockRejectedValue(new Error('Application not found'));

        renderPage();

        const select = await screen.findByRole('combobox', { name: 'Mover a Ana Ejemplo a otra fase' });
        await user.selectOptions(select, 'Technical Interview');

        await waitFor(() => {
            expect(screen.getByText('Error al mover al candidato: Application not found')).toBeTruthy();
        });
        // Sigue en su fase original: la actualización optimista se revirtió.
        expect(within(screen.getByRole('heading', { name: 'Selección inicial' }).closest('.mb-4') as HTMLElement).getByText('Ana Ejemplo')).toBeTruthy();
    });
});
