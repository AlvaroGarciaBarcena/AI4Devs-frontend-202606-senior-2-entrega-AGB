import React from 'react';
import ValidatedField from './ValidatedField';

// Componente genérico, sin nada específico de este proyecto: un bloque de
// datos personales -- nombre, apellido, email, teléfono, dirección --
// que cualquier proyecto que gestione personas (CRM, alta de empleados,
// onboarding, este mismo ATS...) acaba necesitando. Completamente
// controlado (`values`/`onChange`, sin estado propio) y sin ningún texto
// ni dependencia de i18n hardcodeada: quien lo use decide las etiquetas
// (`labels`) y de dónde vienen los mensajes de error (`errors`, un mapa
// plano `{ campo: mensaje }`, no acoplado a la forma concreta que use el
// validador de turno) -- así se puede llevar tal cual a un proyecto que
// ni siquiera use react-i18next.
const FIELDS = [
    { name: 'firstName', type: 'text' },
    { name: 'lastName', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'tel' },
    { name: 'address', type: 'text' },
];

const DEFAULT_REQUIRED_FIELDS = ['firstName', 'lastName', 'email'];

const PersonalDataFields = ({
    values,
    errors = {},
    onChange,
    labels,
    requiredFields = DEFAULT_REQUIRED_FIELDS,
    idPrefix = '',
}) => (
    <>
        {FIELDS.map(({ name, type }) => (
            <ValidatedField
                key={name}
                controlId={`${idPrefix}${name}`}
                label={labels[name]}
                type={type}
                name={name}
                required={requiredFields.includes(name)}
                value={values[name] ?? ''}
                onChange={(e) => onChange(name, e.target.value)}
                className="form-control shadow-sm"
                error={errors[name]}
            />
        ))}
    </>
);

export default PersonalDataFields;
