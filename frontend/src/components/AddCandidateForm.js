import React, { useState } from 'react';
import { Form, Button, Alert, FormControl, Card, Container, Row, Col } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import FileUploader from './FileUploader';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { sendCandidateData } from '../services/candidateService';
import { getLocale, setStoredLocale, translateValidationIssues } from '../i18n/validationMessages';

const LOCALE_OPTIONS = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
];

const AddCandidateForm = () => {
    const [candidate, setCandidate] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        educations: [],
        workExperiences: [],
        cv: null
    });
    const [error, setError] = useState('');
    // Los issues se guardan sin traducir; el mensaje se compone en cada
    // render con el locale actual (ver `fieldErrors` más abajo), así el
    // selector de idioma re-traduce al instante los errores ya visibles
    // sin necesidad de reenviar el formulario.
    const [issues, setIssues] = useState([]); // [{ field, code, params }], ver validator.ts del backend
    const [locale, setLocale] = useState(getLocale());
    const [successMessage, setSuccessMessage] = useState('');

    const fieldErrors = translateValidationIssues(issues, locale);
    const getFieldError = (field) => fieldErrors.find((issue) => issue.field === field);

    const handleLocaleChange = (newLocale) => {
        setLocale(newLocale);
        setStoredLocale(newLocale);
    };

    const handleInputChange = (e, index, section) => {
        const updatedSection = [...candidate[section]];
        if (updatedSection[index]) {
            updatedSection[index][e.target.name] = e.target.value;
            setCandidate({ ...candidate, [section]: updatedSection });
        }
    };

    const handleDateChange = (date, index, section, field) => {
        const updatedSection = [...candidate[section]];
        if (updatedSection[index]) {
            updatedSection[index][field] = date;
            setCandidate({ ...candidate, [section]: updatedSection });
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
            setSuccessMessage('Candidato añadido con éxito');
            setError('');
            setIssues([]);
        } catch (err) {
            setSuccessMessage('');
            if (Array.isArray(err.issues)) {
                setIssues(err.issues);
                setError('');
            } else {
                setIssues([]);
                setError('Error al añadir candidato: ' + err.message);
            }
        }
    };

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="mb-0">Agregar Candidato</h1>
                <div role="group" aria-label="Idioma de los mensajes de error">
                    <span className="me-2 small text-muted">Idioma de los mensajes de error:</span>
                    {LOCALE_OPTIONS.map(({ code, label }) => (
                        <Button
                            key={code}
                            type="button"
                            size="sm"
                            variant={locale === code ? 'primary' : 'outline-primary'}
                            className="me-1"
                            aria-pressed={locale === code}
                            onClick={() => handleLocaleChange(code)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            </div>
            <Card className="shadow p-4">
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group controlId="firstName">
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="firstName"
                                    required
                                    onChange={(e) => setCandidate({ ...candidate, firstName: e.target.value })}
                                    className="form-control shadow-sm"
                                    isInvalid={!!getFieldError('firstName')}
                                    aria-invalid={!!getFieldError('firstName')}
                                    aria-describedby={getFieldError('firstName') ? 'firstName-error' : undefined}
                                />
                                {getFieldError('firstName') && (
                                    <Form.Control.Feedback type="invalid" id="firstName-error">
                                        {getFieldError('firstName').message}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                            <Form.Group controlId="lastName">
                                <Form.Label>Apellido</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="lastName"
                                    required
                                    onChange={(e) => setCandidate({ ...candidate, lastName: e.target.value })}
                                    className="form-control shadow-sm"
                                    isInvalid={!!getFieldError('lastName')}
                                    aria-invalid={!!getFieldError('lastName')}
                                    aria-describedby={getFieldError('lastName') ? 'lastName-error' : undefined}
                                />
                                {getFieldError('lastName') && (
                                    <Form.Control.Feedback type="invalid" id="lastName-error">
                                        {getFieldError('lastName').message}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                            <Form.Group controlId="email">
                                <Form.Label>Correo Electrónico</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    required
                                    onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
                                    className="form-control shadow-sm"
                                    isInvalid={!!getFieldError('email')}
                                    aria-invalid={!!getFieldError('email')}
                                    aria-describedby={getFieldError('email') ? 'email-error' : undefined}
                                />
                                {getFieldError('email') && (
                                    <Form.Control.Feedback type="invalid" id="email-error">
                                        {getFieldError('email').message}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                            <Form.Group controlId="phone">
                                <Form.Label>Teléfono</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="phone"
                                    onChange={(e) => setCandidate({ ...candidate, phone: e.target.value })}
                                    className="form-control shadow-sm"
                                    isInvalid={!!getFieldError('phone')}
                                    aria-invalid={!!getFieldError('phone')}
                                    aria-describedby={getFieldError('phone') ? 'phone-error' : undefined}
                                />
                                {getFieldError('phone') && (
                                    <Form.Control.Feedback type="invalid" id="phone-error">
                                        {getFieldError('phone').message}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                            <Form.Group controlId="address">
                                <Form.Label>Dirección</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="address"
                                    onChange={(e) => setCandidate({ ...candidate, address: e.target.value })}
                                    className="form-control shadow-sm"
                                    isInvalid={!!getFieldError('address')}
                                    aria-invalid={!!getFieldError('address')}
                                    aria-describedby={getFieldError('address') ? 'address-error' : undefined}
                                />
                                {getFieldError('address') && (
                                    <Form.Control.Feedback type="invalid" id="address-error">
                                        {getFieldError('address').message}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="cv">
                                <Form.Label>CV</Form.Label>
                                <FileUploader
                                    onChange={handleCVUpload}
                                    onUpload={handleCVUpload}
                                    className="shadow-sm"
                                />
                            </Form.Group>
                            <Row className="mt-4">
                                <Button onClick={() => handleAddSection('educations')} className="btn btn-primary btn-sm mr-2">Añadir Educación</Button>
                            </Row>
                            {candidate.educations.map((education, index) => (
                                <div key={index} className="mb-3">
                                    <Row className="mt-4">
                                        <Col md={6}>
                                            <FormControl
                                                placeholder="Institución"
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
                                                placeholder="Título"
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
                                                placeholderText="Fecha de Inicio"
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <DatePicker
                                                selected={education.endDate}
                                                onChange={(date) => handleDateChange(date, index, 'educations', 'endDate')}
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText="Fecha de Fin"
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                    </Row>
                                    <Button variant="danger" onClick={() => handleRemoveSection(index, 'educations')} className="mt-2">
                                        <Trash /> Eliminar
                                    </Button>
                                </div>
                            ))}
                            <Row className="mt-4">
                                <Button onClick={() => handleAddSection('workExperiences')} className="btn btn-primary btn-sm mr-2">Añadir Experiencia Laboral</Button>
                            </Row>
                            {candidate.workExperiences.map((experience, index) => (
                                <div key={index} className="mb-3">
                                    <Row className="mt-4">
                                        <Col md={6}>
                                            <FormControl
                                                placeholder="Empresa"
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
                                                placeholder="Puesto"
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
                                                placeholderText="Fecha de Inicio"
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <DatePicker
                                                selected={experience.endDate}
                                                onChange={(date) => handleDateChange(date, index, 'workExperiences', 'endDate')}
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText="Fecha de Fin"
                                                className="form-control shadow-sm"
                                            />
                                        </Col>
                                    </Row>
                                    <Button variant="danger" onClick={() => handleRemoveSection(index, 'workExperiences')} className="mt-2">
                                        <Trash /> Eliminar
                                    </Button>
                                </div>
                            ))}
                        </Col>
                    </Row>
                    <Button type="submit" className="btn btn-primary btn-block shadow-sm mt-5">Enviar</Button>
                    {fieldErrors.length > 0 && (
                        <Alert variant="danger" role="alert" aria-live="assertive" className="mt-3">
                            <Alert.Heading as="h2" className="h6">Revisa los siguientes campos:</Alert.Heading>
                            <ul className="mb-0">
                                {fieldErrors.map((issue) => (
                                    <li key={issue.field}>{issue.message}</li>
                                ))}
                            </ul>
                        </Alert>
                    )}
                    {error && <Alert variant="danger" role="alert" aria-live="assertive" className="mt-3">{error}</Alert>}
                    {successMessage && <Alert variant="success" role="status" aria-live="polite" className="mt-3">{successMessage}</Alert>}
                </Form>
            </Card>
        </Container>
    );
};

export default AddCandidateForm;