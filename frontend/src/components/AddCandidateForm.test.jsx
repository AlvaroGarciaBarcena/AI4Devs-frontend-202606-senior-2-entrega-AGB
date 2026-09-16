import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddCandidateForm from './AddCandidateForm';
import { sendCandidateData } from '../services/candidateService';
import i18n from '../i18n/i18n';

// Codifica, como test automático repetible, el flujo que más veces se
// verificó a mano en el navegador durante toda la sesión: dar de alta un
// candidato con un apellido que contiene un guión bajo, ver el error
// específico del campo (no un "Invalid name" genérico), y comprobar que
// cambiar de idioma re-traduce ese error sin tener que reenviar el
// formulario.

vi.mock('../services/candidateService', () => ({
    sendCandidateData: vi.fn(),
    uploadCV: vi.fn(),
}));

beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('es');
});

const fillBasicFields = async (user, { firstName, lastName, email }) => {
    await user.type(screen.getByLabelText('Nombre'), firstName);
    await user.type(screen.getByLabelText('Apellido'), lastName);
    await user.type(screen.getByLabelText('Correo Electrónico'), email);
};

describe('AddCandidateForm', () => {
    it('shows the specific field error when the last name contains an underscore', async () => {
        const user = userEvent.setup();
        const validationError = new Error('Validation failed');
        validationError.issues = [{ field: 'lastName', code: 'invalidCharacters', params: { char: '_' } }];
        sendCandidateData.mockRejectedValue(validationError);

        render(<AddCandidateForm />);
        await fillBasicFields(user, { firstName: 'Juan', lastName: 'Garcia_', email: 'juan@example.com' });
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        await waitFor(() => {
            expect(sendCandidateData).toHaveBeenCalledTimes(1);
        });

        const expectedMessage = 'El apellido contiene un carácter no permitido: "_". Solo se admiten letras y espacios.';

        // El mensaje aparece por duplicado a propósito: pegado al campo
        // (Form.Control.Feedback) y en el resumen accesible al final.
        expect(screen.getAllByText(expectedMessage)).toHaveLength(2);
        const summary = screen.getByRole('alert');
        expect(summary.textContent).toContain(expectedMessage);

        // El campo queda marcado como inválido para tecnología de asistencia.
        const lastNameInput = screen.getByLabelText('Apellido');
        expect(lastNameInput.getAttribute('aria-invalid')).toBe('true');
        expect(lastNameInput.getAttribute('aria-describedby')).toBe('lastName-error');
    });

    it('re-translates an already-visible error when the language changes, without resubmitting', async () => {
        const user = userEvent.setup();
        const validationError = new Error('Validation failed');
        validationError.issues = [{ field: 'lastName', code: 'invalidCharacters', params: { char: '_' } }];
        sendCandidateData.mockRejectedValue(validationError);

        render(<AddCandidateForm />);
        await fillBasicFields(user, { firstName: 'Juan', lastName: 'Garcia_', email: 'juan@example.com' });
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        await waitFor(() => {
            expect(screen.getAllByText(/no permitido/)).toHaveLength(2);
        });
        expect(sendCandidateData).toHaveBeenCalledTimes(1);

        await act(async () => {
            await i18n.changeLanguage('en');
        });

        expect(
            screen.getAllByText('The last name contains a character that is not allowed: "_". Only letters and spaces are allowed.'),
        ).toHaveLength(2);
        // No se ha vuelto a llamar al servicio: es una re-traducción en el
        // cliente, no un nuevo envío.
        expect(sendCandidateData).toHaveBeenCalledTimes(1);
    });

    it('accumulates several field errors in the same summary, not just the first one', async () => {
        const user = userEvent.setup();
        const validationError = new Error('Validation failed');
        validationError.issues = [
            { field: 'firstName', code: 'required' },
            { field: 'lastName', code: 'required' },
            { field: 'email', code: 'invalidFormat' },
        ];
        sendCandidateData.mockRejectedValue(validationError);

        render(<AddCandidateForm />);
        // Campos requeridos por el navegador (HTML5 "required"): hace falta
        // rellenarlos con algo válido en formato para que el submit llegue a
        // disparar handleSubmit, y así probar la validación acumulada que
        // devuelve el backend.
        await fillBasicFields(user, { firstName: 'X', lastName: 'X', email: 'x@example.com' });
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeTruthy();
        });

        const summary = screen.getByRole('alert');
        expect(summary.textContent).toContain('El nombre es obligatorio.');
        expect(summary.textContent).toContain('El apellido es obligatorio.');
        expect(summary.textContent).toContain('El email no tiene un formato válido.');
    });

    it('shows a success message and clears previous errors after a valid submission', async () => {
        const user = userEvent.setup();
        sendCandidateData.mockResolvedValue({ id: 1, firstName: 'Ana', lastName: 'García', email: 'ana@example.com' });

        render(<AddCandidateForm />);
        await fillBasicFields(user, { firstName: 'Ana', lastName: 'García', email: 'ana@example.com' });
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        await waitFor(() => {
            expect(screen.getByText('Candidato añadido con éxito')).toBeTruthy();
        });
    });
});
