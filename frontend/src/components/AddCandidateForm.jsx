import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FileUploader from './FileUploader';
import ValidatedField from './ValidatedField';
import InlineAlert from './InlineAlert';
import PersonalDataFields from './PersonalDataFields';
import WorkHistoryFields from './WorkHistoryFields';
import { sendCandidateData, getCandidateById, updateCandidateData, uploadCV } from '../services/candidateService';
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

// De la forma que devuelve GET /candidates/:id (Candidate.findOne, con
// educations/workExperiences/applications completos) a la forma que este
// formulario edita -- lo inverso de lo que handleSubmit hace antes de
// enviar. `startDate`/`endDate` llegan como string ISO; DatePicker
// necesita objetos Date de verdad, igual que al escribirlos a mano en el
// formulario. `positionId` sale de la primera candidatura si existe
// alguna -- un candidato editado desde aquí nunca tiene más de una (ver
// la nota junto a updateCandidateProfile en el backend).
const candidateFromExisting = (existingCandidate) => ({
    firstName: existingCandidate.firstName,
    lastName: existingCandidate.lastName,
    email: existingCandidate.email,
    phone: existingCandidate.phone || '',
    address: existingCandidate.address || '',
    positionId: existingCandidate.applications?.[0]?.position?.id ?? '',
    educations: (existingCandidate.educations || []).map((education) => ({
        institution: education.institution,
        title: education.title,
        startDate: education.startDate ? new Date(education.startDate) : '',
        endDate: education.endDate ? new Date(education.endDate) : '',
    })),
    workExperiences: (existingCandidate.workExperiences || []).map((experience) => ({
        company: experience.company,
        position: experience.position,
        description: experience.description || '',
        startDate: experience.startDate ? new Date(experience.startDate) : '',
        endDate: experience.endDate ? new Date(experience.endDate) : '',
    })),
    cv: null,
});

const AddCandidateForm = () => {
    // useTranslation() suscribe al componente a los cambios de idioma de
    // i18next (aunque `t` no se use para los mensajes de validación en sí
    // — translateValidationIssues usa i18n.t() directamente, ver
    // i18n/validationMessages.js —, esta suscripción es lo que hace que
    // `fieldErrors` se recalcule y el componente se re-renderice al
    // cambiar el idioma desde el selector).
    const { t } = useTranslation();
    const navigate = useNavigate();
    // Mismo componente para "Añadir Candidato" (/add-candidate) y "Editar
    // Candidato" (/candidates/:id/edit) -- la única diferencia real es si
    // hay un :id en la ruta, así que se reutiliza toda la interfaz en vez
    // de duplicarla (pedido explícito del usuario).
    const { id } = useParams();
    const isEditMode = !!id;
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

    const {
        data: existingCandidate,
        loading: candidateLoading,
        error: candidateLoadError,
    } = useAsyncData(() => getCandidateById(id), [id], {
        fallbackErrorMessage: t('addCandidate.loadCandidateError'),
        enabled: isEditMode,
    });

    // Solo al cargar el candidato (o si cambia el :id de la ruta), no en
    // cada render -- si dependiera de `candidate` entraría en bucle (este
    // efecto lo modifica).
    useEffect(() => {
        if (existingCandidate) {
            setCandidate(candidateFromExisting(existingCandidate));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingCandidate]);

    // Una posición ya asignada no se puede cambiar desde este formulario
    // (ver la nota junto a updateCandidateProfile en candidateService.ts) --
    // el desplegable se bloquea para que quien edite no crea que puede.
    const hasLockedPosition = isEditMode && (existingCandidate?.applications?.length ?? 0) > 0;

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

    // Los arrays de educación/experiencia y su interacción (añadir, quitar,
    // editar una entrada) viven dentro de WorkHistoryFields -- aquí solo se
    // guarda el array resultante, igual que con cualquier otro campo.
    const handleEducationsChange = (educations) => setCandidate((prev) => ({ ...prev, educations }));
    const handleWorkExperiencesChange = (workExperiences) => setCandidate((prev) => ({ ...prev, workExperiences }));
    const handleWorkHistoryFieldChanged = (section, index, field) => clearFieldIssue(`${section}[${index}].${field}`);

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

            if (isEditMode) {
                await updateCandidateData(id, candidateData);
                setSuccessMessage(t('addCandidate.updateSuccess'));
                setError('');
                setIssues([]);
                // A diferencia del alta, no se vacía el formulario ni se
                // resetea el uploader -- el usuario acaba de guardar estos
                // mismos datos, vaciarlos de golpe sería confuso ("¿se ha
                // guardado o no?"). Se queda viendo lo que guardó, con el
                // mensaje de éxito encima.
            } else {
                await sendCandidateData(candidateData);
                setSuccessMessage(t('addCandidate.success'));
                setError('');
                setIssues([]);
                setCandidate(EMPTY_CANDIDATE);
                setFileUploaderKey((prev) => prev + 1);
            }
        } catch (err) {
            setSuccessMessage('');
            if (Array.isArray(err.issues)) {
                setIssues(err.issues);
                setError('');
            } else {
                setIssues([]);
                const prefix = isEditMode ? t('addCandidate.updateGenericErrorPrefix') : t('addCandidate.genericErrorPrefix');
                setError(prefix + err.message);
            }
        }
    };

    if (isEditMode && candidateLoading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status" />
                <p className="mt-2">{t('addCandidate.loadingCandidate')}</p>
            </Container>
        );
    }

    if (isEditMode && candidateLoadError) {
        return (
            <Container className="mt-5">
                <InlineAlert variant="danger">{candidateLoadError}</InlineAlert>
                <Button variant="secondary" onClick={() => navigate(-1)}>{t('addCandidate.back')}</Button>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            {isEditMode ? (
                <Button variant="link" className="d-inline-block mb-3 px-0" onClick={() => navigate(-1)}>
                    {t('addCandidate.back')}
                </Button>
            ) : (
                <Link to="/" className="d-inline-block mb-3">{t('common.backToDashboard')}</Link>
            )}
            <h1 className="mb-4">{t(isEditMode ? 'addCandidate.editTitle' : 'addCandidate.title')}</h1>
            <Card className="shadow p-4">
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <ValidatedField
                                as="select"
                                controlId="positionId"
                                label={t('addCandidate.applyingPosition')}
                                name="positionId"
                                disabled={positionsLoading || hasLockedPosition}
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
                            {hasLockedPosition && <p className="text-muted small mt-1 mb-0">{t('addCandidate.positionLockedNote')}</p>}
                            <PersonalDataFields
                                values={candidate}
                                errors={{
                                    firstName: getFieldError('firstName')?.message,
                                    lastName: getFieldError('lastName')?.message,
                                    email: getFieldError('email')?.message,
                                    phone: getFieldError('phone')?.message,
                                    address: getFieldError('address')?.message,
                                }}
                                onChange={handleFieldChange}
                                labels={{
                                    firstName: t('addCandidate.firstName'),
                                    lastName: t('addCandidate.lastName'),
                                    email: t('addCandidate.email'),
                                    phone: t('addCandidate.phone'),
                                    address: t('addCandidate.address'),
                                }}
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
                            <WorkHistoryFields
                                educations={candidate.educations}
                                workExperiences={candidate.workExperiences}
                                onEducationsChange={handleEducationsChange}
                                onWorkExperiencesChange={handleWorkExperiencesChange}
                                onFieldChanged={handleWorkHistoryFieldChanged}
                                labels={{
                                    addEducation: t('addCandidate.addEducation'),
                                    addWorkExperience: t('addCandidate.addWorkExperience'),
                                    institutionPlaceholder: t('addCandidate.institutionPlaceholder'),
                                    titlePlaceholder: t('addCandidate.titlePlaceholder'),
                                    startDatePlaceholder: t('addCandidate.startDatePlaceholder'),
                                    endDatePlaceholder: t('addCandidate.endDatePlaceholder'),
                                    companyPlaceholder: t('addCandidate.companyPlaceholder'),
                                    positionPlaceholder: t('addCandidate.positionPlaceholder'),
                                    remove: t('addCandidate.remove'),
                                }}
                            />
                        </Col>
                    </Row>
                    <Button type="submit" className="btn btn-primary btn-block shadow-sm mt-5">{t(isEditMode ? 'addCandidate.saveChanges' : 'addCandidate.submit')}</Button>
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
