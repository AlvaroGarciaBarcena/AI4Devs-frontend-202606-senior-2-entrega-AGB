import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InlineAlert from './InlineAlert';

// Cubre la regla de accesibilidad que este componente existe para no dejar
// a la memoria de cada sitio que lo usa: danger => role="alert" +
// aria-live="assertive" (interrumpe), cualquier otra variante =>
// role="status" + aria-live="polite" (no interrumpe). Login.jsx y
// AddCandidateForm.jsx dependen de este contrato exacto.
describe('InlineAlert', () => {
    it('uses role="alert" and aria-live="assertive" for the danger variant', () => {
        render(<InlineAlert variant="danger">Algo salió mal</InlineAlert>);

        const alert = screen.getByRole('alert');
        expect(alert.getAttribute('aria-live')).toBe('assertive');
        expect(alert.textContent).toBe('Algo salió mal');
    });

    it('uses role="status" and aria-live="polite" for the success variant', () => {
        render(<InlineAlert variant="success">Todo correcto</InlineAlert>);

        const status = screen.getByRole('status');
        expect(status.getAttribute('aria-live')).toBe('polite');
        expect(status.textContent).toBe('Todo correcto');
    });

    it('renders an optional heading before the content', () => {
        render(
            <InlineAlert variant="danger" heading="Revisa estos campos">
                <ul>
                    <li>Error 1</li>
                </ul>
            </InlineAlert>,
        );

        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Revisa estos campos');
        expect(alert.textContent).toContain('Error 1');
    });
});
