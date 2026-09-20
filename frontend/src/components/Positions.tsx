import React, { useState } from 'react';
import { Card, Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getPositions } from '../services/positionService';
import { useAsyncData } from '../hooks/useAsyncData';
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
    // Solo al montar: no queremos volver a pedir las posiciones cada vez
    // que cambia el idioma, solo re-traducir lo que ya está en pantalla
    // (t() se re-evalúa en cada render igualmente) -- por eso deps: [].
    const { data, loading, error } = useAsyncData<Position[]>(getPositions, [], {
        fallbackErrorMessage: t('positions.fetchError'),
    });
    const positions = data ?? [];

    // Los tres filtros son puramente de cliente (ya se cargaron todas las
    // posiciones de golpe): título por subcadena sin distinguir
    // mayúsculas/acentos exactos, fecha como "con deadline en esa fecha o
    // antes" (encontrar las que cierran pronto es el caso de uso más
    // probable para un reclutador, más que una fecha exacta), y estado por
    // coincidencia exacta con el desplegable. Se combinan con Y: una
    // posición tiene que cumplir los tres a la vez.
    const [titleFilter, setTitleFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filteredPositions = positions.filter((position) => {
        if (titleFilter && !position.title.toLowerCase().includes(titleFilter.toLowerCase())) {
            return false;
        }
        if (dateFilter) {
            if (!position.applicationDeadline || position.applicationDeadline.slice(0, 10) > dateFilter) {
                return false;
            }
        }
        if (statusFilter && position.status !== statusFilter) {
            return false;
        }
        return true;
    });
    const hasActiveFilters = !!(titleFilter || dateFilter || statusFilter);

    return (
        <Container className="mt-5">
            <Link to="/" className="d-inline-block mb-3">{t('common.backToDashboard')}</Link>
            <h2 className="text-center mb-4">{t('positions.title')}</h2>
            <Row className="mb-4">
                <Col md={4}>
                    <Form.Control
                        type="text"
                        placeholder={t('positions.searchByTitle')}
                        aria-label={t('positions.searchByTitle')}
                        value={titleFilter}
                        onChange={(e) => setTitleFilter(e.target.value)}
                    />
                </Col>
                <Col md={4}>
                    <Form.Control
                        type="date"
                        placeholder={t('positions.searchByDate')}
                        aria-label={t('positions.searchByDate')}
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                </Col>
                <Col md={4}>
                    <Form.Control
                        as="select"
                        aria-label={t('positions.statusFilterLabel')}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
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
            {!loading && !error && positions.length > 0 && filteredPositions.length === 0 && (
                <Alert variant="info">{t(hasActiveFilters ? 'positions.noMatches' : 'positions.empty')}</Alert>
            )}
            <Row>
                {filteredPositions.map((position) => (
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
