import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireAuth from './RequireAuth';
import { AuthProvider } from '../context/AuthContext';

// AuthProvider arranca leyendo la sesión de localStorage (ver
// AuthContext.jsx) — sembrarlo directamente aquí, sin mockear
// services/authService, prueba el camino real de principio a fin.
const STORAGE_KEY = 'lti_auth';

beforeEach(() => {
    localStorage.clear();
});

const renderProtectedRoute = (initialPath = '/protected') =>
    render(
        <AuthProvider>
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route path="/protected" element={<RequireAuth><div>Secret content</div></RequireAuth>} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>,
    );

describe('RequireAuth', () => {
    it('redirects to /login when there is no stored session', () => {
        renderProtectedRoute();

        expect(screen.getByText('Login Page')).toBeTruthy();
        expect(screen.queryByText('Secret content')).toBeNull();
    });

    it('renders the protected content when a session is stored', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            token: 'a.jwt.token',
            employee: { id: 1, name: 'Alice Johnson', email: 'alice.johnson@lti.com', role: 'Interviewer', companyId: 1 },
        }));

        renderProtectedRoute();

        expect(screen.getByText('Secret content')).toBeTruthy();
        expect(screen.queryByText('Login Page')).toBeNull();
    });
});
