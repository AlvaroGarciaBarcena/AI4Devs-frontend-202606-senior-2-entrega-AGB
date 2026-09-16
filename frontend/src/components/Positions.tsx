import React, { useEffect, useState } from 'react';
import { Card, Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getPositions } from '../services/positionService';
import { useTranslation } from 'react-i18next';

type Position = {
    id: number;
    title: string;
    companyName: string;
    location: string;
    status: string;
    applicationDeadline: string | null;
};

const STATUS_BADGE_VARIANT: Record<string, string> = {
    Open: 'bg-warning',
    Filled: 'bg-success',
    Closed: 'bg-secondary',
    Draft: 'bg-secondary',
};

const Positions: React.FC = () => {
    const { t } = useTranslation();
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const data = await getPositions();
                setPositions(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : t('positions.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchPositions();
        // Solo al montar: no queremos volver a pedir las posiciones cada
        // vez que cambia el idioma, solo re-traducir lo que ya está en
        // pantalla (t() se re-evalúa en cada render igualmente).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Container className="mt-5">
            <h2 className="text-center mb-4">{t('positions.title')}</h2>
            <Row className="mb-4">
                <Col md={4}>
                    <Form.Control type="text" placeholder={t('positions.searchByTitle')} />
                </Col>
                <Col md={4}>
                    <Form.Control type="date" placeholder={t('positions.searchByDate')} />
                </Col>
                <Col md={4}>
                    <Form.Control as="select">
                        <option value="">{t('positions.statusFilterLabel')}</option>
                        <option value="Open">{t('positions.status.open')}</option>
                        <option value="Filled">{t('positions.status.filled')}</option>
                        <option value="Closed">{t('positions.status.closed')}</option>
                        <option value="Draft">{t('positions.status.draft')}</option>
                    </Form.Control>
                </Col>
            </Row>
            {loading && (
                <div className="text-center">
                    <Spinner animation="border" role="status" />
                </div>
            )}
            {error && <Alert variant="danger">{error}</Alert>}
            {!loading && !error && positions.length === 0 && (
                <Alert variant="info">{t('positions.empty')}</Alert>
            )}
            <Row>
                {positions.map((position) => (
                    <Col md={4} key={position.id} className="mb-4">
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Card.Title>{position.title}</Card.Title>
                                <Card.Text>
                                    <strong>{t('positions.company')}</strong> {position.companyName}<br />
                                    <strong>{t('positions.location')}</strong> {position.location}<br />
                                    <strong>{t('positions.deadline')}</strong> {position.applicationDeadline ? position.applicationDeadline.slice(0, 10) : '—'}
                                </Card.Text>
                                <span className={`badge ${STATUS_BADGE_VARIANT[position.status] || 'bg-secondary'} text-white`}>
                                    {t(`positions.status.${position.status.toLowerCase()}`)}
                                </span>
                                <div className="d-flex justify-content-between mt-3">
                                    <Link to={`/positions/${position.id}`}>
                                        <Button variant="primary">{t('positions.viewProcess')}</Button>
                                    </Link>
                                    <Button variant="secondary" disabled title={t('positions.editNotImplemented')}>{t('positions.edit')}</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default Positions;
