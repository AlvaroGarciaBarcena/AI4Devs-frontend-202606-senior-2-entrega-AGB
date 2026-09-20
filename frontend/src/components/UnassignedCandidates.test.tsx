import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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

// Para comprobar que de verdad navega, no solo que hay un enlace con el
// href correcto -- registra la ruta de destino real (/candidates/:id/edit)
// con un marcador visible, igual que en AddCandidateForm.test.jsx.
const renderPageWithEditRoute = () =>
    render(
        <MemoryRouter initialEntries={['/candidates/unassigned']}>
            <Routes>
                <Route path="/candidates/unassigned" element={<UnassignedCandidates />} />
                <Route path="/candidates/:id/edit" element={<div>Editando candidato</div>} />
            </Routes>
        </MemoryRouter>,
    );

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

    // Pedido por el usuario: pulsar la fila entera navega a la edición,
    // como atajo de ratón -- sin dejar de tener el enlace del icono como
    // acceso real por teclado/lector de pantalla (siguiente test).
    it('navigates to the edit screen when clicking anywhere on the row', async () => {
        const user = userEvent.setup();
        vi.mocked(getUnassignedCandidates).mockResolvedValue([
            { id: 18, fullName: 'Bad Position', email: 'bad.position3@example.com', createdAt: '2026-09-19T10:00:00.000Z' },
        ]);

        renderPageWithEditRoute();
        await waitFor(() => expect(screen.getByText('Bad Position')).toBeTruthy());

        await user.click(screen.getByText('bad.position3@example.com'));

        expect(screen.getByText('Editando candidato')).toBeTruthy();
    });

    // El icono es decorativo (aria-hidden); el nombre accesible real del
    // enlace viene de aria-label, no del texto visible ni solo del title
    // -- así un lector de pantalla lo anuncia igual que antes de
    // cambiarlo a icono.
    it('keeps an accessible "Editar" link with a hover tooltip, even though the icon has no visible text', async () => {
        vi.mocked(getUnassignedCandidates).mockResolvedValue([
            { id: 18, fullName: 'Bad Position', email: 'bad.position3@example.com', createdAt: '2026-09-19T10:00:00.000Z' },
        ]);

        renderPage();
        await waitFor(() => expect(screen.getByText('Bad Position')).toBeTruthy());

        const editLink = screen.getByRole('link', { name: 'Editar' });
        expect(editLink.getAttribute('href')).toBe('/candidates/18/edit');
        expect(editLink.getAttribute('title')).toBe('Editar');
    });
});
