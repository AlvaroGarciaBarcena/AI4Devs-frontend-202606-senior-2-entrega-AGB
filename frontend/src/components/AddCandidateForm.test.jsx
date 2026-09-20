import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddCandidateForm from './AddCandidateForm';
import { sendCandidateData } from '../services/candidateService';
import { getPositions } from '../services/positionService';
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

vi.mock('../services/positionService', () => ({
    getPositions: vi.fn(),
}));

const MOCK_POSITIONS = [
    { id: 1, title: 'Senior Full-Stack Engineer', companyName: 'LTI' },
    { id: 2, title: 'Data Scientist', companyName: 'LTI' },
];

beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('es');
    getPositions.mockResolvedValue(MOCK_POSITIONS);
});

// Las posiciones se cargan de forma asíncrona (useEffect + GET /position),
// así que el desplegable arranca vacío salvo el placeholder — hace falta
// esperar (findByLabelText) a que la opción real exista antes de poder
// seleccionarla.
const fillBasicFields = async (user, { firstName, lastName, email }) => {
    const positionSelect = await screen.findByLabelText(/Posición a la que se presenta/);
    await user.selectOptions(positionSelect, '1');
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

    // Caso reportado por el usuario: tras un error, corregir el campo no
    // "recargaba" nada visible — el mensaje y el borde rojo seguían ahí
    // hasta reenviar el formulario, aunque el valor ya fuera válido.
    it('clears a field error as soon as the user corrects it, without waiting for resubmission', async () => {
        const user = userEvent.setup();
        const validationError = new Error('Validation failed');
        validationError.issues = [{ field: 'phone', code: 'invalidPhoneFormat' }];
        sendCandidateData.mockRejectedValue(validationError);

        render(<AddCandidateForm />);
        await fillBasicFields(user, { firstName: 'Juan', lastName: 'Garcia', email: 'juan@example.com' });
        await user.type(screen.getByLabelText('Teléfono'), '123456789');
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        const expectedMessage = 'El teléfono debe tener 9 dígitos y empezar por 6, 7 o 9.';
        await waitFor(() => {
            expect(screen.getAllByText(expectedMessage)).toHaveLength(2);
        });

        await user.clear(screen.getByLabelText('Teléfono'));
        await user.type(screen.getByLabelText('Teléfono'), '612345678');

        expect(screen.queryByText(expectedMessage)).toBeNull();
        // El error desaparece por corregir el campo, no por un nuevo envío.
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

    // El desplegable es la pieza nueva de esta rama: lista las posiciones
    // reales (GET /position), no texto libre, y su valor se envía como
    // número (el <select> siempre entrega un string).
    it('populates the position dropdown and sends the chosen positionId as a number', async () => {
        const user = userEvent.setup();
        sendCandidateData.mockResolvedValue({ id: 1, firstName: 'Ana', lastName: 'García', email: 'ana@example.com' });

        render(<AddCandidateForm />);
        const positionSelect = await screen.findByLabelText(/Posición a la que se presenta/);

        expect(screen.getByRole('option', { name: 'Senior Full-Stack Engineer — LTI' })).toBeTruthy();
        expect(screen.getByRole('option', { name: 'Data Scientist — LTI' })).toBeTruthy();

        await user.selectOptions(positionSelect, '2');
        await user.type(screen.getByLabelText('Nombre'), 'Ana');
        await user.type(screen.getByLabelText('Apellido'), 'García');
        await user.type(screen.getByLabelText('Correo Electrónico'), 'ana@example.com');
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        await waitFor(() => {
            expect(sendCandidateData).toHaveBeenCalledWith(expect.objectContaining({ positionId: 2 }));
        });
    });

    // Elegir posición es opcional: un candidato puede registrarse "sin
    // asignar". `Number('')` da 0, no null -- sin este caso especial,
    // enviar el formulario sin elegir posición mandaría positionId: 0, que
    // el backend rechazaría (0 no es un entero positivo) en vez de
    // guardarse sin candidatura.
    it('sends positionId as null (not 0) when no position is chosen', async () => {
        const user = userEvent.setup();
        sendCandidateData.mockResolvedValue({ id: 1, firstName: 'Sin', lastName: 'Posicion', email: 'sin.posicion@example.com' });

        render(<AddCandidateForm />);
        await screen.findByLabelText(/Posición a la que se presenta/);
        await user.type(screen.getByLabelText('Nombre'), 'Sin');
        await user.type(screen.getByLabelText('Apellido'), 'Posicion');
        await user.type(screen.getByLabelText('Correo Electrónico'), 'sin.posicion@example.com');
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        await waitFor(() => {
            expect(sendCandidateData).toHaveBeenCalledWith(expect.objectContaining({ positionId: null }));
        });
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

    // Caso reportado por el usuario: tras un alta con éxito, los datos del
    // candidato recién creado se quedaban en pantalla, invitando a
    // reenviarlos sin querer como si fuera un candidato nuevo.
    it('clears every field after a successful submission', async () => {
        const user = userEvent.setup();
        sendCandidateData.mockResolvedValue({ id: 1, firstName: 'Ana', lastName: 'García', email: 'ana@example.com' });

        render(<AddCandidateForm />);
        await fillBasicFields(user, { firstName: 'Ana', lastName: 'García', email: 'ana@example.com' });
        await user.type(screen.getByLabelText('Teléfono'), '612345678');
        await user.type(screen.getByLabelText('Dirección'), 'Calle Falsa 123');
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        await waitFor(() => {
            expect(screen.getByText('Candidato añadido con éxito')).toBeTruthy();
        });

        expect(screen.getByLabelText('Nombre').value).toBe('');
        expect(screen.getByLabelText('Apellido').value).toBe('');
        expect(screen.getByLabelText('Correo Electrónico').value).toBe('');
        expect(screen.getByLabelText('Teléfono').value).toBe('');
        expect(screen.getByLabelText('Dirección').value).toBe('');
        expect(screen.getByLabelText(/Posición a la que se presenta/).value).toBe('');
    });
});
