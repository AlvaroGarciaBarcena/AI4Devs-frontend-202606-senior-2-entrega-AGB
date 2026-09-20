import React from 'react';
import { Alert } from 'react-bootstrap';

// Componente genérico, sin nada específico de esta app: solo depende de
// react-bootstrap. Encapsula la pareja role/aria-live correcta según el
// tipo de mensaje -- antes se escribía a mano en cada sitio (Login.jsx y
// AddCandidateForm.jsx x3), con el riesgo real de que una copia se
// desincronizara de las demás (p. ej. un role="alert" con aria-live="polite"
// por descuido, que un lector de pantalla no anunciaría con la urgencia
// esperada).
//
// - danger (error): role="alert" + aria-live="assertive" -- interrumpe lo
//   que el lector de pantalla esté diciendo, para errores que necesitan
//   atención inmediata.
// - success/otro: role="status" + aria-live="polite" -- se anuncia sin
//   interrumpir.
const InlineAlert = ({ variant = 'danger', heading, headingAs = 'h2', children, className }) => {
    const role = variant === 'danger' ? 'alert' : 'status';
    const ariaLive = role === 'alert' ? 'assertive' : 'polite';

    return (
        <Alert variant={variant} role={role} aria-live={ariaLive} className={className}>
            {heading && (
                <Alert.Heading as={headingAs} className="h6">
                    {heading}
                </Alert.Heading>
            )}
            {children}
        </Alert>
    );
};

export default InlineAlert;
