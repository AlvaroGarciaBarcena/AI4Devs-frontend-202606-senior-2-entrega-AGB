import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PositionProcess from './PositionProcess';
import { getCandidatesByPosition, getInterviewFlowByPosition } from '../services/positionService';
import i18n from '../i18n/i18n';

vi.mock('../services/positionService', () => ({
    getCandidatesByPosition: vi.fn(),
    getInterviewFlowByPosition: vi.fn(),
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

describe('PositionProcess', () => {
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
            expect(screen.getByText('Selección inicial')).toBeTruthy();
        });
        expect(screen.getByText('Entrevista técnica')).toBeTruthy();
        expect(screen.queryByText('Initial Screening')).toBeNull();
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
            expect(screen.getByText('Culture Fit Chat')).toBeTruthy();
        });
    });
});
