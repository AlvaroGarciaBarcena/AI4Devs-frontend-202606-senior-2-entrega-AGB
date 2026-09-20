import React from 'react';
import { Form } from 'react-bootstrap';

// Componente genérico, sin nada específico de esta app: solo depende de
// react-bootstrap. Encapsula el bloque que antes se repetía a mano 6 veces
// dentro de AddCandidateForm.jsx (uno por campo: posición, nombre,
// apellido, email, teléfono, dirección) -- misma estructura, mismo
// cableado de accesibilidad, solo cambiando el nombre del campo:
//
//   <Form.Group controlId="X">
//     <Form.Label>...</Form.Label>
//     <Form.Control/Select isInvalid aria-invalid aria-describedby .../>
//     {error && <Form.Control.Feedback type="invalid" id="X-error">...}
//   </Form.Group>
//
// `as="select"` cambia Form.Control por Form.Select (para desplegables);
// cualquier otra prop (type, name, value, onChange, required, disabled...)
// se reenvía tal cual al control, así que sigue funcionando como un
// <Form.Control>/<Form.Select> normal desde fuera.
const ValidatedField = ({ controlId, label, error, as = 'input', children, groupClassName, ...controlProps }) => {
    const hasError = !!error;
    const errorId = hasError ? `${controlId}-error` : undefined;
    const Control = as === 'select' ? Form.Select : Form.Control;

    return (
        <Form.Group controlId={controlId} className={groupClassName}>
            <Form.Label>{label}</Form.Label>
            <Control
                {...controlProps}
                isInvalid={hasError}
                aria-invalid={hasError}
                aria-describedby={errorId}
            >
                {children}
            </Control>
            {hasError && (
                <Form.Control.Feedback type="invalid" id={errorId}>
                    {error}
                </Form.Control.Feedback>
            )}
        </Form.Group>
    );
};

export default ValidatedField;
