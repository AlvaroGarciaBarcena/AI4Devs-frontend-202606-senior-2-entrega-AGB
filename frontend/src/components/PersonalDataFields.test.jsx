import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from 'react-bootstrap';
import PersonalDataFields from './PersonalDataFields';

const LABELS = {
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Email',
    phone: 'Teléfono',
    address: 'Dirección',
};

const EMPTY_VALUES = { firstName: '', lastName: '', email: '', phone: '', address: '' };

// Componente genérico (sin nada de este proyecto): estos tests no
// mencionan "candidato" en ningún sitio a propósito, para comprobar que
// de verdad no depende de nada del dominio de esta app -- solo de sus
// propias props.
describe('PersonalDataFields', () => {
    it('renders every field with the given labels and values', () => {
        render(
            <Form>
                <PersonalDataFields
                    values={{ ...EMPTY_VALUES, firstName: 'Ana', email: 'ana@example.com' }}
                    onChange={() => {}}
                    labels={LABELS}
                />
            </Form>,
        );

        expect(screen.getByLabelText('Nombre').value).toBe('Ana');
        expect(screen.getByLabelText('Email').value).toBe('ana@example.com');
        expect(screen.getByLabelText('Teléfono').value).toBe('');
    });

    it('calls onChange with the field name and new value on every keystroke', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(
            <Form>
                <PersonalDataFields values={EMPTY_VALUES} onChange={handleChange} labels={LABELS} />
            </Form>,
        );

        await user.type(screen.getByLabelText('Nombre'), 'X');

        expect(handleChange).toHaveBeenCalledWith('firstName', 'X');
    });

    it('marks a field invalid and shows its error message when one is given', () => {
        render(
            <Form>
                <PersonalDataFields
                    values={EMPTY_VALUES}
                    onChange={() => {}}
                    labels={LABELS}
                    errors={{ email: 'Formato inválido' }}
                />
            </Form>,
        );

        const email = screen.getByLabelText('Email');
        expect(email.getAttribute('aria-invalid')).toBe('true');
        expect(screen.getByText('Formato inválido')).toBeTruthy();
        expect(screen.getByLabelText('Nombre').getAttribute('aria-invalid')).toBe('false');
    });

    it('only marks firstName, lastName and email as required by default', () => {
        render(
            <Form>
                <PersonalDataFields values={EMPTY_VALUES} onChange={() => {}} labels={LABELS} />
            </Form>,
        );

        expect(screen.getByLabelText('Nombre').required).toBe(true);
        expect(screen.getByLabelText('Teléfono').required).toBe(false);
        expect(screen.getByLabelText('Dirección').required).toBe(false);
    });

    it('lets the caller override which fields are required', () => {
        render(
            <Form>
                <PersonalDataFields
                    values={EMPTY_VALUES}
                    onChange={() => {}}
                    labels={LABELS}
                    requiredFields={['phone']}
                />
            </Form>,
        );

        expect(screen.getByLabelText('Teléfono').required).toBe(true);
        expect(screen.getByLabelText('Nombre').required).toBe(false);
    });
});
