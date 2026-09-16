import React, { useState } from 'react';
import { Form, Button, Alert, FormControl, Card, Container, Row, Col } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import FileUploader from './FileUploader';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { sendCandidateData } from '../services/candidateService';
import { translateValidationIssues } from '../i18n/validationMessages';
import { useTranslation } from 'react-i18next';

const AddCandidateForm = () => {
    // useTranslation() suscribe al componente a los cambios de idioma de
    // i18next (aunque `t` no se use para los mensajes de validación en sí
    // — translateValidationIssues usa i18n.t() directamente, ver
    // i18n/validationMessages.js —, esta suscripción es lo que hace que
    // `fieldErrors` se recalcule y el componente se re-renderice al
    // cambiar el idioma desde el selector).
    const { t } = useTranslation();
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
    // render con el idioma actual de i18next, así un cambio de idioma
    // re-traduce al instante los errores ya visibles sin necesidad de
    // reenviar el formulario.
    const [issues, setIssues] = useState([]); // [{ field, code, params }], ver validator.ts del backend
    const [successMessage, setSuccessMessage] = useState('');

    const fieldErrors = translateValidationIssues(issues);
    const getFieldError = (field) => fieldErrors.find((issue) => issue.field === field);

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
            setSuccessMessage(t('addCandidate.success'));
            setError('');
            setIssues([]);
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
                            <Form.Group controlId="firstName">
                                <Form.Label>{t('addCandidate.firstName')}</Form.Label>
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
                                <Form.Label>{t('addCandidate.lastName')}</Form.Label>
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
                                <Form.Label>{t('addCandidate.email')}</Form.Label>
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
                                <Form.Label>{t('addCandidate.phone')}</Form.Label>
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
                                <Form.Label>{t('addCandidate.address')}</Form.Label>
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
                                <Form.Label>{t('addCandidate.cv')}</Form.Label>
                                <FileUploader
                                    onChange={handleCVUpload}
                                    onUpload={handleCVUpload}
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
                        <Alert variant="danger" role="alert" aria-live="assertive" className="mt-3">
                            <Alert.Heading as="h2" className="h6">{t('addCandidate.reviewFields')}</Alert.Heading>
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
