import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AddCandidateForm from './AddCandidateForm';
import { sendCandidateData, getCandidateById, updateCandidateData } from '../services/candidateService';
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
    getCandidateById: vi.fn(),
    updateCandidateData: vi.fn(),
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

// useParams()/useNavigate() (modo edición) exigen un contexto de router
// de verdad, no solo <MemoryRouter> -- sin <Routes>/<Route> no hay
// coincidencia de ruta de la que leer el :id.
const renderForm = (path = '/add-candidate') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/add-candidate" element={<AddCandidateForm />} />
                <Route path="/candidates/:id/edit" element={<AddCandidateForm />} />
            </Routes>
        </MemoryRouter>,
    );

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

        renderForm();
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

        renderForm();
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

        renderForm();
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

        renderForm();
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

        renderForm();
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

        renderForm();
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

        renderForm();
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

        renderForm();
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

    // Caso real que motivó esto: con el backend caído, axios lanza
    // "Network Error" (sin traducir) en vez de un rechazo real del
    // servidor -- se distingue con isNetworkError (candidateService.js/
    // apiErrors.js) para mostrar un mensaje traducido y accionable.
    it('shows the translated network-error message, not the raw "Network Error" text, when the backend is unreachable', async () => {
        const user = userEvent.setup();
        sendCandidateData.mockRejectedValue(Object.assign(new Error('Network Error'), { isNetworkError: true }));

        renderForm();
        await fillBasicFields(user, { firstName: 'Ana', lastName: 'García', email: 'ana@example.com' });
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        await waitFor(() => {
            expect(screen.getByText('No se pudo conectar con el servidor. Comprueba tu conexión, o que el servidor esté en marcha.')).toBeTruthy();
        });
    });
});

// Mismo componente que "Añadir Candidato", en /candidates/:id/edit --
// reutilizado a propósito (pedido explícito del usuario) en vez de
// construir una pantalla de edición aparte.
describe('AddCandidateForm in edit mode', () => {
    const EXISTING_CANDIDATE_NO_APPLICATION = {
        id: 42,
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'nombre1apellido1@email.com',
        phone: '623456789',
        address: 'Aquí vivo yo',
        educations: [{ id: 1, institution: 'MIT', title: 'BSc', startDate: '2018-01-01T00:00:00.000Z', endDate: '2020-01-01T00:00:00.000Z' }],
        workExperiences: [],
        resumes: [],
        applications: [],
    };

    it('prefills every field with the fetched candidate', async () => {
        getCandidateById.mockResolvedValue(EXISTING_CANDIDATE_NO_APPLICATION);

        renderForm('/candidates/42/edit');

        await waitFor(() => {
            expect(screen.getByLabelText('Nombre').value).toBe('Nombre');
        });
        expect(screen.getByLabelText('Apellido').value).toBe('Apellido');
        expect(screen.getByLabelText('Correo Electrónico').value).toBe('nombre1apellido1@email.com');
        expect(screen.getByLabelText('Teléfono').value).toBe('623456789');
        expect(screen.getByLabelText('Dirección').value).toBe('Aquí vivo yo');
        expect(screen.getByDisplayValue('MIT')).toBeTruthy();
        expect(getCandidateById).toHaveBeenCalledWith('42');
    });

    it('shows the edit title and a "save changes" button, not the create-mode ones', async () => {
        getCandidateById.mockResolvedValue(EXISTING_CANDIDATE_NO_APPLICATION);

        renderForm('/candidates/42/edit');

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Editar Candidato' })).toBeTruthy();
        });
        expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeTruthy();
    });

    it('calls updateCandidateData (not sendCandidateData) on submit, and keeps the values visible on success', async () => {
        const user = userEvent.setup();
        getCandidateById.mockResolvedValue(EXISTING_CANDIDATE_NO_APPLICATION);
        updateCandidateData.mockResolvedValue({ data: EXISTING_CANDIDATE_NO_APPLICATION });

        renderForm('/candidates/42/edit');
        await waitFor(() => expect(screen.getByLabelText('Nombre').value).toBe('Nombre'));

        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        await waitFor(() => {
            expect(updateCandidateData).toHaveBeenCalledWith('42', expect.objectContaining({ firstName: 'Nombre' }));
        });
        expect(sendCandidateData).not.toHaveBeenCalled();
        expect(screen.getByText('Candidato actualizado con éxito')).toBeTruthy();
        // A diferencia del alta, no se vacía tras guardar.
        expect(screen.getByLabelText('Nombre').value).toBe('Nombre');
    });

    it('leaves the position dropdown enabled when the candidate has no application yet', async () => {
        getCandidateById.mockResolvedValue(EXISTING_CANDIDATE_NO_APPLICATION);

        renderForm('/candidates/42/edit');

        await waitFor(() => expect(screen.getByLabelText('Nombre').value).toBe('Nombre'));
        expect(screen.getByLabelText(/Posición a la que se presenta/).disabled).toBe(false);
        expect(screen.queryByText(/Ya tiene una candidatura asignada/)).toBeNull();
    });

    // No se puede reasignar la posición de un candidato que ya tiene
    // candidatura desde este formulario (ver candidateService.ts) -- el
    // desplegable se bloquea para que no parezca que sí se puede.
    it('locks the position dropdown and explains why when the candidate already has an application', async () => {
        getCandidateById.mockResolvedValue({
            ...EXISTING_CANDIDATE_NO_APPLICATION,
            applications: [{ id: 1, positionId: 1, position: { id: 1, title: 'Senior Full-Stack Engineer' } }],
        });

        renderForm('/candidates/42/edit');

        await waitFor(() => expect(screen.getByLabelText('Nombre').value).toBe('Nombre'));
        expect(screen.getByLabelText(/Posición a la que se presenta/).disabled).toBe(true);
        expect(screen.getByText(/Ya tiene una candidatura asignada/)).toBeTruthy();
    });
});
