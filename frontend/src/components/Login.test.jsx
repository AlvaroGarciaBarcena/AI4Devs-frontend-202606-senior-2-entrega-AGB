import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../context/AuthContext';
import * as authService from '../services/authService';
import i18n from '../i18n/i18n';

vi.mock('../services/authService', async () => {
    const actual = await vi.importActual('../services/authService');
    return { ...actual, login: vi.fn() };
});

beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    await i18n.changeLanguage('es');
});

const renderLogin = () =>
    render(
        <AuthProvider>
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<div>Dashboard</div>} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>,
    );

describe('Login', () => {
    it('submits the entered credentials and navigates to / on success', async () => {
        const user = userEvent.setup();
        authService.login.mockResolvedValue({ id: 1, name: 'Alice Johnson' });

        renderLogin();
        await user.type(screen.getByLabelText('Correo electrónico'), 'alice.johnson@lti.com');
        await user.type(screen.getByLabelText('Contraseña'), 'Changeme123!');
        await user.click(screen.getByRole('button', { name: 'Entrar' }));

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith('alice.johnson@lti.com', 'Changeme123!');
        });
        await waitFor(() => {
            expect(screen.getByText('Dashboard')).toBeTruthy();
        });
    });

    it('shows an accessible error message with the translated prefix on failure, and does not navigate', async () => {
        const user = userEvent.setup();
        authService.login.mockRejectedValue(new Error('Email o contraseña incorrectos'));

        renderLogin();
        await user.type(screen.getByLabelText('Correo electrónico'), 'alice.johnson@lti.com');
        await user.type(screen.getByLabelText('Contraseña'), 'wrong');
        await user.click(screen.getByRole('button', { name: 'Entrar' }));

        await waitFor(() => {
            expect(screen.getByRole('alert').textContent).toBe('Error al iniciar sesión: Email o contraseña incorrectos');
        });
        expect(screen.queryByText('Dashboard')).toBeNull();
    });
});
