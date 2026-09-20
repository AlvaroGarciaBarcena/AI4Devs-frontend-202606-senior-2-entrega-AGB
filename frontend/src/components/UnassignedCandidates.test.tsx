import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UnassignedCandidates from './UnassignedCandidates';
import { getUnassignedCandidates } from '../services/candidateService';
import i18n from '../i18n/i18n';

vi.mock('../services/candidateService', () => ({
    getUnassignedCandidates: vi.fn(),
}));

beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('es');
});

const renderPage = () => render(<MemoryRouter><UnassignedCandidates /></MemoryRouter>);

describe('UnassignedCandidates', () => {
    it('lists every unassigned candidate with name, email and registration date', async () => {
        vi.mocked(getUnassignedCandidates).mockResolvedValue([
            { id: 18, fullName: 'Bad Position', email: 'bad.position3@example.com', createdAt: '2026-09-19T10:00:00.000Z' },
            { id: 10, fullName: 'Nombre Apellido', email: 'nombre1apellido1@email.com', createdAt: '2026-09-10T10:00:00.000Z' },
        ]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Bad Position')).toBeTruthy();
        });
        expect(screen.getByText('bad.position3@example.com')).toBeTruthy();
        expect(screen.getByText('Nombre Apellido')).toBeTruthy();
    });

    it('shows an empty-state message instead of a bare empty list', async () => {
        vi.mocked(getUnassignedCandidates).mockResolvedValue([]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No hay ningún candidato sin asignar.')).toBeTruthy();
        });
        expect(screen.queryByRole('table')).toBeNull();
    });

    it('shows the fetch error message when the request fails', async () => {
        vi.mocked(getUnassignedCandidates).mockRejectedValue(new Error('network down'));

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('network down')).toBeTruthy();
        });
    });
});
