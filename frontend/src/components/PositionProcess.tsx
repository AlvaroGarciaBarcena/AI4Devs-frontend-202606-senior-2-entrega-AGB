import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { getCandidatesByPosition, getInterviewFlowByPosition } from '../services/positionService';

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
    const { id } = useParams<{ id: string }>();
    const [flow, setFlow] = useState<InterviewFlow | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        const fetchProcess = async () => {
            try {
                const [flowData, candidatesData] = await Promise.all([
                    getInterviewFlowByPosition(id),
                    getCandidatesByPosition(id),
                ]);
                setFlow(flowData);
                setCandidates(candidatesData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al obtener el proceso de la posición');
            } finally {
                setLoading(false);
            }
        };

        fetchProcess();
    }, [id]);

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
                    <Button variant="secondary">Volver a posiciones</Button>
                </Link>
            </Container>
        );
    }

    if (!flow) {
        return null;
    }

    const steps = [...flow.interviewFlow.interviewSteps].sort((a, b) => a.orderIndex - b.orderIndex);

    return (
        <Container className="mt-5">
            <Link to="/positions" className="d-inline-block mb-3">&larr; Volver a posiciones</Link>
            <h2 className="mb-4">Proceso de selección: {flow.positionName}</h2>
            {steps.length === 0 ? (
                <Alert variant="info">Esta posición no tiene un flujo de entrevistas configurado.</Alert>
            ) : (
                <Row>
                    {steps.map((step) => {
                        const stepCandidates = candidates.filter((c) => c.currentInterviewStep === step.name);
                        return (
                            <Col md={Math.max(3, Math.floor(12 / steps.length))} key={step.id} className="mb-4">
                                <div className="p-2 bg-light border rounded">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="mb-0">{step.name}</h6>
                                        <Badge bg="secondary">{stepCandidates.length}</Badge>
                                    </div>
                                    {stepCandidates.length === 0 && (
                                        <p className="text-muted small">Sin candidatos en esta fase.</p>
                                    )}
                                    {stepCandidates.map((candidate) => (
                                        <Card key={candidate.applicationId} className="mb-2 shadow-sm">
                                            <Card.Body className="py-2 px-3">
                                                <Card.Text className="mb-1"><strong>{candidate.fullName}</strong></Card.Text>
                                                <Card.Text className="mb-0 small text-muted">
                                                    Puntuación media: {candidate.averageScore.toFixed(1)}
                                                </Card.Text>
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
