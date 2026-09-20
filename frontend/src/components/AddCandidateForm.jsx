import React, { useState } from 'react';
import { Form, Button, FormControl, Card, Container, Row, Col } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import FileUploader from './FileUploader';
import ValidatedField from './ValidatedField';
import InlineAlert from './InlineAlert';
import ReactDatePickerModule from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// El interop CJS→ESM del pre-bundler de dependencias de Vite envuelve dos
// veces el export por defecto de react-datepicker@6.9.0 (el paquete no
// tiene un único `module.exports =`, solo `exports.default = DatePicker`
// junto a otros exports nombrados): `import DatePicker from
// 'react-datepicker'` acaba trayendo el objeto de módulo entero en vez del
// propio componente, y React lo rechaza con "Element type is invalid"
// (confirmado reproduciendo el fallo al pulsar "Añadir Educación", antes de
// aplicar este fix). Se desenvuelve a mano por si acaso, sin depender de
// que el bundler lo resuelva bien.
const DatePicker = ReactDatePickerModule.default || ReactDatePickerModule;
import { sendCandidateData, uploadCV } from '../services/candidateService';
import { getPositions } from '../services/positionService';
import { useAsyncData } from '../hooks/useAsyncData';
import { translateValidationIssues } from '../i18n/validationMessages';
import { useTranslation } from 'react-i18next';

// Fuera del componente: el mismo objeto se usa para el estado inicial y
// para vaciar el formulario tras un alta con éxito (antes no se hacía
// ninguna de las dos cosas al reenviar — los datos del candidato recién
// creado se quedaban en pantalla, invitando a reenviarlos por error).
// `positionId` es un desplegable, no texto libre: solo puede valer uno de
// los ids que devuelve GET /position, nunca un valor inventado a mano.
const EMPTY_CANDIDATE = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    positionId: '',
    educations: [],
    workExperiences: [],
    cv: null
};

const AddCandidateForm = () => {
    // useTranslation() suscribe al componente a los cambios de idioma de
    // i18next (aunque `t` no se use para los mensajes de validación en sí
    // — translateValidationIssues usa i18n.t() directamente, ver
    // i18n/validationMessages.js —, esta suscripción es lo que hace que
    // `fieldErrors` se recalcule y el componente se re-renderice al
    // cambiar el idioma desde el selector).
    const { t } = useTranslation();
    const [candidate, setCandidate] = useState(EMPTY_CANDIDATE);
    // FileUploader guarda su propio estado interno (fichero seleccionado,
    // nombre mostrado, resultado de la subida) que no depende de props del
    // padre — vaciar `candidate.cv` no le hace olvidar lo ya mostrado.
    // Cambiar su `key` fuerza a React a desmontarlo y montar uno nuevo
    // limpio, en vez de reutilizar la instancia con su estado antiguo.
    const [fileUploaderKey, setFileUploaderKey] = useState(0);
    const [error, setError] = useState('');
    // Los issues se guardan sin traducir; el mensaje se compone en cada
    // render con el idioma actual de i18next, así un cambio de idioma
    // re-traduce al instante los errores ya visibles sin necesidad de
    // reenviar el formulario.
    const [issues, setIssues] = useState([]); // [{ field, code, params }], ver validator.ts del backend
    const [successMessage, setSuccessMessage] = useState('');
    // Antes se cargaba con getPositions().then/.catch a mano, sin ningún
    // estado de carga -- el desplegable arrancaba vacío ("Selecciona una
    // posición" sin más opciones) sin ninguna señal de que las posiciones
    // reales todavía estaban en camino, indistinguible de "no hay
    // posiciones". positionsLoading llena ese hueco real de UX.
    const {
        data: positionsData,
        loading: positionsLoading,
        error: positionsError,
    } = useAsyncData(getPositions, []);
    const positions = positionsData ?? [];

    const fieldErrors = translateValidationIssues(issues);
    const getFieldError = (field) => fieldErrors.find((issue) => issue.field === field);

    // `issues` solo se actualizaba en handleSubmit: si un campo se marcaba
    // inválido y el usuario lo corregía sin volver a enviar, el mensaje y
    // el borde rojo seguían ahí, sin reflejar la corrección, hasta el
    // siguiente intento de envío. Se limpia el issue de un campo en cuanto
    // cambia — no se revalida en el cliente (esa lógica solo vive en
    // validator.ts, ver la cabecera de este fichero de arriba), simplemente
    // deja de mostrarse un error sobre un valor que ya no existe.
    const clearFieldIssue = (field) => setIssues((prev) => prev.filter((issue) => issue.field !== field));

    const handleFieldChange = (field, value) => {
        setCandidate((prev) => ({ ...prev, [field]: value }));
        clearFieldIssue(field);
    };

    const handleInputChange = (e, index, section) => {
        const updatedSection = [...candidate[section]];
        if (updatedSection[index]) {
            updatedSection[index][e.target.name] = e.target.value;
            setCandidate({ ...candidate, [section]: updatedSection });
            clearFieldIssue(`${section}[${index}].${e.target.name}`);
        }
    };

    const handleDateChange = (date, index, section, field) => {
        const updatedSection = [...candidate[section]];
        if (updatedSection[index]) {
            updatedSection[index][field] = date;
            setCandidate({ ...candidate, [section]: updatedSection });
            clearFieldIssue(`${section}[${index}].${field}`);
        }
    };

    const handleAddSection = (section) => {
        const newSection = section === 'educations' ? { institution: '', title: '', startDate: '', endDate: '' } : { company: '', position: '', description: '', startDate: '', endDate: '' };
        setCandidate({ ...candidate, [section]: [...candidate[section], newSection] });
    };

    const handleRemoveSection = (index, section) => {
        const updatedSection = [...candidate[section]];
        updatedSection.splice(index, 1);
        setCandidate({ ...candidate, [section]: updatedSection });
    };

    const handleCVUpload = (fileData) => {
        setCandidate({ ...candidate, cv: fileData });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const candidateData = {
                ...candidate,
                // El <select> siempre entrega un string; el backend espera
                // un entero, o null si no se ha elegido ninguna posición
                // (elegir posición es opcional -- ver validatePositionId en
                // validator.ts). `Number('')` da 0, no null, así que hay que
                // distinguirlo a mano: enviar 0 lo rechazaría el validador
                // (0 no es un entero positivo), en vez de guardarse sin
                // candidatura como se espera.
                positionId: candidate.positionId ? Number(candidate.positionId) : null,
                cv: candidate.cv ? {
                    filePath: candidate.cv.filePath,
                    fileType: candidate.cv.fileType
                } : null
            };

            // Format date fields to YYYY-MM-DD before sending to the endpoint
            candidateData.educations = candidateData.educations.map(education => ({
                ...education,
                startDate: education.startDate ? education.startDate.toISOString().slice(0, 10) : '',
                endDate: education.endDate ? education.endDate.toISOString().slice(0, 10) : ''
            }));
            candidateData.workExperiences = candidateData.workExperiences.map(experience => ({
                ...experience,
                startDate: experience.startDate ? experience.startDate.toISOString().slice(0, 10) : '',
                endDate: experience.endDate ? experience.endDate.toISOString().slice(0, 10) : ''
            }));

            await sendCandidateData(candidateData);
            setSuccessMessage(t('addCandidate.success'));
            setError('');
            setIssues([]);
            setCandidate(EMPTY_CANDIDATE);
            setFileUploaderKey((prev) => prev + 1);
        } catch (err) {
            setSuccessMessage('');
            if (Array.isArray(err.issues)) {
                setIssues(err.issues);
                setError('');
            } else {
                setIssues([]);
                setError(t('addCandidate.genericErrorPrefix') + err.message);
            }
        }
    };

    return (
        <Container className="mt-5">
            <h1 className="mb-4">{t('addCandidate.title')}</h1>
            <Card className="shadow p-4">
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <ValidatedField
                                as="select"
                                controlId="positionId"
                                label={t('addCandidate.applyingPosition')}
                                name="positionId"
                                disabled={positionsLoading}
                                value={candidate.positionId}
                                onChange={(e) => handleFieldChange('positionId', e.target.value)}
                                className="shadow-sm"
                                error={getFieldError('positionId')?.message}
                            >
                                <option value="">
                                    {positionsLoading ? t('addCandidate.loadingPositions') : t('addCandidate.selectPositionPlaceholder')}
                                </option>
                                {positions.map((position) => (
                                    <option key={position.id} value={position.id}>
                                        {position.title} — {position.companyName}
                                    </option>
                                ))}
                            </ValidatedField>
                            {positionsError && <p className="text-danger small mt-1 mb-0">{positionsError}</p>}
                            <ValidatedField
                                controlId="firstName"
                                label={t('addCandidate.firstName')}
                                type="text"
                                name="firstName"
                                required
                                value={candidate.firstName}
                                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                                className="form-control shadow-sm"
                                error={getFieldError('firstName')?.message}
                            />
                            <ValidatedField
                                controlId="lastName"
                                label={t('addCandidate.lastName')}
                                type="text"
                                name="lastName"
                                required
                                value={candidate.lastName}
                                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                                className="form-control shadow-sm"
                                error={getFieldError('lastName')?.message}
                            />
                            <ValidatedField
                                controlId="email"
                                label={t('addCandidate.email')}
                                type="email"
                                name="email"
                                required
                                value={candidate.email}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                className="form-control shadow-sm"
                                error={getFieldError('email')?.message}
                            />
                            <ValidatedField
                                controlId="phone"
                                label={t('addCandidate.phone')}
                                type="tel"
                                name="phone"
                                value={candidate.phone}
                                onChange={(e) => handleFieldChange('phone', e.target.value)}
                                className="form-control shadow-sm"
                                error={getFieldError('phone')?.message}
                            />
                            <ValidatedField
                                controlId="address"
                                label={t('addCandidate.address')}
                                type="text"
                                name="address"
                                value={candidate.address}
                                onChange={(e) => handleFieldChange('address', e.target.value)}
                                className="form-control shadow-sm"
                                error={getFieldError('address')?.message}
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="cv">
                                <Form.Label>{t('addCandidate.cv')}</Form.Label>
                                <FileUploader
                                    key={fileUploaderKey}
                                    onChange={handleCVUpload}
                                    onUpload={handleCVUpload}
                                    uploadFn={uploadCV}
                                    className="shadow-sm"
                                />
                            </Form.Group>
                            <Row className="mt-4">
                                <Button onClick={() => handleAddSection('educations')} className="btn btn-primary btn-sm mr-2">{t('addCandidate.addEducation')}</Button>
                            </Row>
                            {candidate.educations.map((education, index) => (
                                <div key={index} className="mb-3">
                                    <Row className="mt-4">
                                        <Col md={6}>
                                            <FormControl
                                                placeholder={t('addCandidate.institutionPlaceholder')}
                                                name="institution"
                                                value={education.institution}
                                                onChange={(e) => handleInputChange(e, index, 'educations')}
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="mt-2">
                                        <Col md={6}>
                                            <FormControl
                                                placeholder={t('addCandidate.titlePlaceholder')}
                                                name="title"
                                                value={education.title}
                                                onChange={(e) => handleInputChange(e, index, 'educations')}
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="mt-2">
                                        <Col md={6}>
                                            <DatePicker
                                                selected={education.startDate}
                                                onChange={(date) => handleDateChange(date, index, 'educations', 'startDate')}
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText={t('addCandidate.startDatePlaceholder')}
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <DatePicker
                                                selected={education.endDate}
                                                onChange={(date) => handleDateChange(date, index, 'educations', 'endDate')}
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText={t('addCandidate.endDatePlaceholder')}
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                    </Row>
                                    <Button variant="danger" onClick={() => handleRemoveSection(index, 'educations')} className="mt-2">
                                        <Trash /> {t('addCandidate.remove')}
                                    </Button>
                                </div>
                            ))}
                            <Row className="mt-4">
                                <Button onClick={() => handleAddSection('workExperiences')} className="btn btn-primary btn-sm mr-2">{t('addCandidate.addWorkExperience')}</Button>
                            </Row>
                            {candidate.workExperiences.map((experience, index) => (
                                <div key={index} className="mb-3">
                                    <Row className="mt-4">
                                        <Col md={6}>
                                            <FormControl
                                                placeholder={t('addCandidate.companyPlaceholder')}
                                                name="company"
                                                value={experience.company}
                                                onChange={(e) => handleInputChange(e, index, 'workExperiences')}
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="mt-2">
                                        <Col md={6}>
                                            <FormControl
                                                placeholder={t('addCandidate.positionPlaceholder')}
                                                name="position"
                                                value={experience.position}
                                                onChange={(e) => handleInputChange(e, index, 'workExperiences')}
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="mt-2">
                                        <Col md={6}>
                                            <DatePicker
                                                selected={experience.startDate}
                                                onChange={(date) => handleDateChange(date, index, 'workExperiences', 'startDate')}
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText={t('addCandidate.startDatePlaceholder')}
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <DatePicker
                                                selected={experience.endDate}
                                                onChange={(date) => handleDateChange(date, index, 'workExperiences', 'endDate')}
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText={t('addCandidate.endDatePlaceholder')}
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                    </Row>
                                    <Button variant="danger" onClick={() => handleRemoveSection(index, 'workExperiences')} className="mt-2">
                                        <Trash /> {t('addCandidate.remove')}
                                    </Button>
                                </div>
                            ))}
                        </Col>
                    </Row>
                    <Button type="submit" className="btn btn-primary btn-block shadow-sm mt-5">{t('addCandidate.submit')}</Button>
                    {fieldErrors.length > 0 && (
                        <InlineAlert variant="danger" heading={t('addCandidate.reviewFields')} className="mt-3">
                            <ul className="mb-0">
                                {fieldErrors.map((issue) => (
                                    <li key={issue.field}>{issue.message}</li>
                                ))}
                            </ul>
                        </InlineAlert>
                    )}
                    {error && <InlineAlert variant="danger" className="mt-3">{error}</InlineAlert>}
                    {successMessage && <InlineAlert variant="success" className="mt-3">{successMessage}</InlineAlert>}
                </Form>
            </Card>
        </Container>
    );
};

export default AddCandidateForm;
