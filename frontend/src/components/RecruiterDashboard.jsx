import React from 'react';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/lti-logo.png'; // Ruta actualizada para importar desde src/assets
import { useTranslation } from 'react-i18next';

const RecruiterDashboard = () => {
    const { t } = useTranslation();

    return (
        <Container className="mt-5">
            <div className="text-center"> {/* Contenedor para el logo */}
                <img src={logo} alt={t('dashboard.logoAlt')} style={{ width: '150px' }} />
            </div>
            <h1 className="mb-4 text-center">{t('dashboard.title')}</h1>
            <Row>
                <Col md={6}>
                    <Card className="shadow p-4">
                        <h5 className="mb-4">{t('dashboard.addCandidate.heading')}</h5>
                        <Link to="/add-candidate">
                            <Button variant="primary" className="btn-block">{t('dashboard.addCandidate.button')}</Button>
                        </Link>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow p-4">
                        <h5 className="mb-4">{t('dashboard.viewPositions.heading')}</h5>
                        <Link to="/positions">
                            <Button variant="primary" className="btn-block">{t('dashboard.viewPositions.button')}</Button>
                        </Link>
                    </Card>
                </Col>
                <Col md={6} className="mt-4">
                    <Card className="shadow p-4">
                        <h5 className="mb-4">{t('dashboard.unassignedCandidates.heading')}</h5>
                        <Link to="/candidates/unassigned">
                            <Button variant="secondary" className="btn-block">{t('dashboard.unassignedCandidates.button')}</Button>
                        </Link>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default RecruiterDashboard;
