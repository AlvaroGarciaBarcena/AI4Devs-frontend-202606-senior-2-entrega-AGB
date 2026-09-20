import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { getCandidatesByPosition, getInterviewFlowByPosition, addInterviewStep } from '../services/positionService';
import { updateCandidateStage } from '../services/candidateService';
import { useAsyncData } from '../hooks/useAsyncData';
import { useTranslation } from 'react-i18next';

type Candidate = {
    id: number;
    applicationId: number;
    fullName: string;
    currentInterviewStep: string;
    averageScore: number;
};

type InterviewStep = {
    id: number;
    name: string;
    orderIndex: number;
};

type InterviewFlow = {
    positionName: string;
    interviewFlow: {
        id: number;
        description: string | null;
        interviewSteps: InterviewStep[];
    };
};

const PositionProcess: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const { data, loading, error } = useAsyncData<[InterviewFlow, Candidate[]]>(
        () => Promise.all([getInterviewFlowByPosition(id as string), getCandidatesByPosition(id as string)]),
        [id],
        { fallbackErrorMessage: t('positionProcess.fetchError'), networkErrorMessage: t('common.networkError'), enabled: !!id },
    );
    const [flow, fetchedCandidates] = data ?? [null, []];
    const fetchedSteps = flow ? [...flow.interviewFlow.interviewSteps].sort((a, b) => a.orderIndex - b.orderIndex) : [];

    // Copias locales editables: `data` es lo que devolvió el fetch, y no
    // tiene forma de actualizarse por sí sola cuando el usuario mueve una
    // tarjeta (arrastrándola o con el selector accesible) o añade una fase
    // nueva, sin recargar toda la página de golpe. Se resincronizan con el
    // fetch cada vez que `data` cambia (llegada de un fetch nuevo);
    // mientras tanto, cada acción actualiza su propia copia (un movimiento
    // fallido revierte `candidates`; una fase añadida con éxito amplía
    // `steps`).
    const [candidates, setCandidates] = useState(fetchedCandidates);
    const [steps, setSteps] = useState(fetchedSteps);
    useEffect(() => {
        setCandidates(fetchedCandidates);
        setSteps(fetchedSteps);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const [movingApplicationId, setMovingApplicationId] = useState<number | null>(null);
    const [moveError, setMoveError] = useState('');
    const [dragOverStepId, setDragOverStepId] = useState<number | null>(null);
    const [newStepName, setNewStepName] = useState('');
    const [addingStep, setAddingStep] = useState(false);
    const [addStepError, setAddStepError] = useState('');

    const handleAddStep = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newStepName.trim();
        if (!name || addingStep) {
            return;
        }
        setAddingStep(true);
        setAddStepError('');
        try {
            const result = await addInterviewStep(id as string, name);
            setSteps((prev) => [...prev, result.data]);
            setNewStepName('');
        } catch (err) {
            if (err && typeof err === 'object' && 'isNetworkError' in err && (err as { isNetworkError?: boolean }).isNetworkError) {
                setAddStepError(t('common.networkError'));
            } else {
                setAddStepError(t('positionProcess.addStep.errorPrefix') + (err instanceof Error ? err.message : ''));
            }
        } finally {
            setAddingStep(false);
        }
    };

    const moveCandidate = async (candidate: Candidate, targetStep: InterviewStep) => {
        if (candidate.currentInterviewStep === targetStep.name || movingApplicationId !== null) {
            return;
        }
        const previousCandidates = candidates;
        setMoveError('');
        setMovingApplicationId(candidate.applicationId);
        setCandidates((prev) =>
            prev.map((c) => (c.applicationId === candidate.applicationId ? { ...c, currentInterviewStep: targetStep.name } : c)),
        );
        try {
            await updateCandidateStage(candidate.id, candidate.applicationId, targetStep.id);
        } catch (err) {
            setCandidates(previousCandidates);
            if (err && typeof err === 'object' && 'isNetworkError' in err && (err as { isNetworkError?: boolean }).isNetworkError) {
                setMoveError(t('common.networkError'));
            } else {
                setMoveError(t('positionProcess.moveErrorPrefix') + (err instanceof Error ? err.message : ''));
            }
        } finally {
            setMovingApplicationId(null);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
                <Link to="/positions">
                    <Button variant="secondary">{t('positionProcess.back')}</Button>
                </Link>
            </Container>
        );
    }

    if (!flow) {
        return null;
    }

    return (
        <Container className="mt-5">
            <Link to="/positions" className="d-inline-block mb-3">{t('positionProcess.back')}</Link>
            <h2 className="mb-4 py-2 sticky-top bg-white border-bottom">
                {t('positionProcess.title')}{flow.positionName}
            </h2>
            {moveError && <Alert variant="danger" dismissible onClose={() => setMoveError('')}>{moveError}</Alert>}
            <Form className="d-flex flex-wrap align-items-start gap-2 mb-4" onSubmit={handleAddStep}>
                <Form.Control
                    type="text"
                    style={{ maxWidth: '320px' }}
                    placeholder={t('positionProcess.addStep.placeholder')}
                    aria-label={t('positionProcess.addStep.placeholder')}
                    value={newStepName}
                    onChange={(e) => setNewStepName(e.target.value)}
                    disabled={addingStep}
                    maxLength={100}
                />
                <Button type="submit" variant="outline-primary" disabled={addingStep || !newStepName.trim()}>
                    {addingStep ? <Spinner as="span" animation="border" size="sm" role="status" /> : t('positionProcess.addStep.button')}
                </Button>
            </Form>
            {addStepError && <Alert variant="danger" dismissible onClose={() => setAddStepError('')}>{addStepError}</Alert>}
            {steps.length === 0 ? (
                <Alert variant="info">{t('positionProcess.noFlow')}</Alert>
            ) : (
                <Row>
                    {steps.map((step) => {
                        const stepCandidates = candidates.filter((c) => c.currentInterviewStep === step.name);
                        return (
                            <Col md={Math.max(3, Math.floor(12 / steps.length))} key={step.id} className="mb-4">
                                <div
                                    className={`p-2 bg-light border rounded ${dragOverStepId === step.id ? 'border-primary border-2' : ''}`}
                                    // Zona donde soltar una tarjeta arrastrada: el navegador solo
                                    // dispara onDrop si onDragOver hace preventDefault (si no, un
                                    // <div> normal no es un destino de drop válido).
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOverStepId(step.id);
                                    }}
                                    onDragLeave={() => setDragOverStepId((current) => (current === step.id ? null : current))}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOverStepId(null);
                                        const applicationId = Number(e.dataTransfer.getData('text/plain'));
                                        const candidate = candidates.find((c) => c.applicationId === applicationId);
                                        if (candidate) {
                                            void moveCandidate(candidate, step);
                                        }
                                    }}
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="mb-0">
                                            {t(`positionProcess.interviewStepNames.${step.name}`, { defaultValue: step.name })}
                                        </h6>
                                        <Badge bg="secondary">{stepCandidates.length}</Badge>
                                    </div>
                                    {stepCandidates.length === 0 && (
                                        <p className="text-muted small">{t('positionProcess.noCandidatesInStep')}</p>
                                    )}
                                    {stepCandidates.map((candidate) => (
                                        <Card
                                            key={candidate.applicationId}
                                            className="mb-2 shadow-sm"
                                            style={{ cursor: 'grab' }}
                                            // Arrastrar con ratón es solo un atajo de conveniencia: el
                                            // selector de abajo hace exactamente lo mismo por teclado,
                                            // lector de pantalla o pantalla táctil (el drag-and-drop
                                            // nativo no funciona en móvil sin más).
                                            draggable={movingApplicationId === null}
                                            onDragStart={(e) => e.dataTransfer.setData('text/plain', String(candidate.applicationId))}
                                        >
                                            <Card.Body className="py-2 px-3">
                                                <Card.Text className="mb-1"><strong>{candidate.fullName}</strong></Card.Text>
                                                <Card.Text className="mb-0 small text-muted">
                                                    {t('positionProcess.averageScore')}{candidate.averageScore.toFixed(1)}
                                                </Card.Text>
                                                <Link to={`/candidates/${candidate.id}/edit`} className="small">{t('positionProcess.editCandidate')}</Link>
                                                <div className="mt-1 d-flex align-items-center gap-2">
                                                    <select
                                                        className="form-select form-select-sm"
                                                        aria-label={t('positionProcess.moveToAriaLabel', { name: candidate.fullName })}
                                                        title={t('positionProcess.moveToLabel')}
                                                        value={candidate.currentInterviewStep}
                                                        disabled={movingApplicationId !== null}
                                                        onChange={(e) => {
                                                            const targetStep = steps.find((s) => s.name === e.target.value);
                                                            if (targetStep) {
                                                                void moveCandidate(candidate, targetStep);
                                                            }
                                                        }}
                                                    >
                                                        {steps.map((s) => (
                                                            <option key={s.id} value={s.name}>
                                                                {t(`positionProcess.interviewStepNames.${s.name}`, { defaultValue: s.name })}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {movingApplicationId === candidate.applicationId && (
                                                        <Spinner animation="border" size="sm" role="status" />
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Container>
    );
};

export default PositionProcess;
