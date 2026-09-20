import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from 'react-bootstrap';
import ValidatedField from './ValidatedField';

// Cubre el contrato que AddCandidateForm.jsx espera de este componente
// genérico: mismo cableado de accesibilidad (aria-invalid/aria-describedby/
// Form.Control.Feedback) que antes se escribía a mano por cada campo, sin
// error visible mientras no hay error, y soporte tanto de <input> como de
// <select> (as="select") con las mismas props.
describe('ValidatedField', () => {
    it('renders a labeled input with no error styling when there is no error', () => {
        render(
            <Form>
                <ValidatedField controlId="firstName" label="Nombre" value="" onChange={() => {}} />
            </Form>,
        );

        const input = screen.getByLabelText('Nombre');
        expect(input.getAttribute('aria-invalid')).toBe('false');
        expect(input.getAttribute('aria-describedby')).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('marks the field invalid and shows the error message tied by aria-describedby', () => {
        render(
            <Form>
                <ValidatedField controlId="email" label="Email" value="" onChange={() => {}} error="Formato inválido" />
            </Form>,
        );

        const input = screen.getByLabelText('Email');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')).toBe('email-error');
        expect(document.getElementById('email-error').textContent).toBe('Formato inválido');
    });

    it('renders as a <select> with its options when as="select"', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(
            <Form>
                <ValidatedField as="select" controlId="positionId" label="Posición" value="" onChange={handleChange}>
                    <option value="">Selecciona</option>
                    <option value="1">Senior Engineer</option>
                </ValidatedField>
            </Form>,
        );

        const select = screen.getByLabelText('Posición');
        expect(select.tagName).toBe('SELECT');
        await user.selectOptions(select, '1');
        expect(handleChange).toHaveBeenCalled();
    });

    it('forwards arbitrary control props such as required and disabled', () => {
        render(
            <Form>
                <ValidatedField controlId="phone" label="Teléfono" value="" onChange={() => {}} required disabled />
            </Form>,
        );

        const input = screen.getByLabelText('Teléfono');
        expect(input.required).toBe(true);
        expect(input.disabled).toBe(true);
    });
});
