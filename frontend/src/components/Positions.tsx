import React, { useEffect, useState } from 'react';
import { Card, Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getPositions } from '../services/positionService';

type Position = {
    id: number;
    title: string;
    companyName: string;
    location: string;
    status: string;
    applicationDeadline: string | null;
};

const statusBadgeVariant = (status: string) => {
    switch (status) {
        case 'Open':
            return 'warning';
        case 'Filled':
            return 'success';
        case 'Closed':
            return 'secondary';
        case 'Draft':
        default:
            return 'secondary';
    }
};

const Positions: React.FC = () => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const data = await getPositions();
                setPositions(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al obtener las posiciones');
            } finally {
                setLoading(false);
            }
        };

        fetchPositions();
    }, []);

    return (
        <Container className="mt-5">
            <h2 className="text-center mb-4">Posiciones</h2>
            <Row className="mb-4">
                <Col md={4}>
                    <Form.Control type="text" placeholder="Buscar por título" />
                </Col>
                <Col md={4}>
                    <Form.Control type="date" placeholder="Buscar por fecha" />
                </Col>
                <Col md={4}>
                    <Form.Control as="select">
                        <option value="">Estado</option>
                        <option value="Open">Abierto</option>
                        <option value="Filled">Cubierto</option>
                        <option value="Closed">Cerrado</option>
                        <option value="Draft">Borrador</option>
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
                <Alert variant="info">No hay posiciones disponibles.</Alert>
            )}
            <Row>
                {positions.map((position) => (
                    <Col md={4} key={position.id} className="mb-4">
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Card.Title>{position.title}</Card.Title>
                                <Card.Text>
                                    <strong>Empresa:</strong> {position.companyName}<br />
                                    <strong>Ubicación:</strong> {position.location}<br />
                                    <strong>Deadline:</strong> {position.applicationDeadline ? position.applicationDeadline.slice(0, 10) : '—'}
                                </Card.Text>
                                <span className={`badge bg-${statusBadgeVariant(position.status)} text-white`}>
                                    {position.status}
                                </span>
                                <div className="d-flex justify-content-between mt-3">
                                    <Link to={`/positions/${position.id}`}>
                                        <Button variant="primary">Ver proceso</Button>
                                    </Link>
                                    <Button variant="secondary" disabled title="Edición de posiciones aún no implementada">Editar</Button>
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
