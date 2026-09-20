import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Positions from './Positions';
import { getPositions } from '../services/positionService';
import i18n from '../i18n/i18n';

vi.mock('../services/positionService', () => ({
    getPositions: vi.fn(),
}));

const MOCK_POSITIONS = [
    { id: 1, title: 'Senior Full-Stack Engineer', companyName: 'LTI', location: 'Remote', status: 'Open', applicationDeadline: '2024-12-31T00:00:00.000Z' },
    { id: 2, title: 'Data Scientist', companyName: 'LTI', location: 'Remote', status: 'Closed', applicationDeadline: '2024-06-30T00:00:00.000Z' },
];

beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('es');
    vi.mocked(getPositions).mockResolvedValue(MOCK_POSITIONS);
});

const renderPositions = () => render(<MemoryRouter><Positions /></MemoryRouter>);

describe('Positions filters', () => {
    it('filters by a substring of the title, case-insensitively', async () => {
        const user = userEvent.setup();
        renderPositions();
        await waitFor(() => expect(screen.getByText('Data Scientist')).toBeTruthy());

        await user.type(screen.getByPlaceholderText('Buscar por título'), 'data sci');

        expect(screen.getByText('Data Scientist')).toBeTruthy();
        expect(screen.queryByText('Senior Full-Stack Engineer')).toBeNull();
    });

    it('filters by status, exact match', async () => {
        const user = userEvent.setup();
        renderPositions();
        await waitFor(() => expect(screen.getByText('Data Scientist')).toBeTruthy());

        await user.selectOptions(screen.getByLabelText('Estado'), 'Closed');

        expect(screen.getByText('Data Scientist')).toBeTruthy();
        expect(screen.queryByText('Senior Full-Stack Engineer')).toBeNull();
    });

    it('filters by deadline on-or-before the chosen date', async () => {
        const user = userEvent.setup();
        renderPositions();
        await waitFor(() => expect(screen.getByText('Data Scientist')).toBeTruthy());

        // Solo "Data Scientist" (deadline 2024-06-30) queda dentro de "el
        // 2024-07-01 o antes"; "Senior Full-Stack Engineer" (2024-12-31)
        // queda fuera.
        const dateInput = screen.getByPlaceholderText('Buscar por fecha');
        await user.type(dateInput, '2024-07-01');

        expect(screen.getByText('Data Scientist')).toBeTruthy();
        expect(screen.queryByText('Senior Full-Stack Engineer')).toBeNull();
    });

    it('combines every active filter with AND', async () => {
        const user = userEvent.setup();
        renderPositions();
        await waitFor(() => expect(screen.getByText('Data Scientist')).toBeTruthy());

        await user.type(screen.getByPlaceholderText('Buscar por título'), 'Data');
        await user.selectOptions(screen.getByLabelText('Estado'), 'Open');

        // "Data Scientist" cumple el título pero no el estado (es Closed).
        expect(screen.queryByText('Data Scientist')).toBeNull();
        expect(screen.queryByText('Senior Full-Stack Engineer')).toBeNull();
    });

    // Caso pedido explícitamente: distinguir "no hay posiciones en
    // absoluto" de "hay posiciones, pero ninguna cumple los filtros".
    it('shows a distinct message when filters exclude every position', async () => {
        const user = userEvent.setup();
        renderPositions();
        await waitFor(() => expect(screen.getByText('Data Scientist')).toBeTruthy());

        await user.type(screen.getByPlaceholderText('Buscar por título'), 'nada-coincide-con-esto');

        expect(screen.getByText('Ninguna posición coincide con los filtros.')).toBeTruthy();
        expect(screen.queryByText('No hay posiciones disponibles.')).toBeNull();
    });

    it('shows the plain empty-state message when there are no positions at all', async () => {
        vi.mocked(getPositions).mockResolvedValue([]);
        renderPositions();

        await waitFor(() => {
            expect(screen.getByText('No hay posiciones disponibles.')).toBeTruthy();
        });
    });
});
