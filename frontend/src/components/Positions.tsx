import React from 'react';
import { Card, Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useLocale } from '../i18n/LocaleContext';

type PositionStatus = 'open' | 'filled' | 'closed' | 'draft';

type Position = {
    title: string;
    manager: string;
    deadline: string;
    status: PositionStatus;
};

const mockPositions: Position[] = [
    { title: 'Senior Backend Engineer', manager: 'John Doe', deadline: '2024-12-31', status: 'open' },
    { title: 'Junior Android Engineer', manager: 'Jane Smith', deadline: '2024-11-15', status: 'filled' },
    { title: 'Product Manager', manager: 'Alex Jones', deadline: '2024-07-31', status: 'draft' }
];

const STATUS_BADGE_VARIANT: Record<PositionStatus, string> = {
    open: 'bg-warning',
    filled: 'bg-success',
    closed: 'bg-warning',
    draft: 'bg-secondary',
};

const Positions: React.FC = () => {
    const { t } = useLocale();

    return (
        <Container className="mt-5">
            <h2 className="text-center mb-4">{t('positions.title')}</h2>
            <Row className="mb-4">
                <Col md={3}>
                    <Form.Control type="text" placeholder={t('positions.searchByTitle')} />
                </Col>
                <Col md={3}>
                    <Form.Control type="date" placeholder={t('positions.searchByDate')} />
                </Col>
                <Col md={3}>
                    <Form.Control as="select">
                        <option value="">{t('positions.statusFilterLabel')}</option>
                        <option value="open">{t('positions.status.open')}</option>
                        <option value="filled">{t('positions.status.filled')}</option>
                        <option value="closed">{t('positions.status.closed')}</option>
                        <option value="draft">{t('positions.status.draft')}</option>
                    </Form.Control>
                </Col>
                <Col md={3}>
                    <Form.Control as="select">
                        <option value="">{t('positions.managerFilterLabel')}</option>
                        <option value="john_doe">John Doe</option>
                        <option value="jane_smith">Jane Smith</option>
                        <option value="alex_jones">Alex Jones</option>
                    </Form.Control>
                </Col>
            </Row>
            <Row>
                {mockPositions.map((position, index) => (
                    <Col md={4} key={index} className="mb-4">
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Card.Title>{position.title}</Card.Title>
                                <Card.Text>
                                    <strong>{t('positions.managerLabel')}</strong> {position.manager}<br />
                                    <strong>{t('positions.deadline')}</strong> {position.deadline}
                                </Card.Text>
                                <span className={`badge ${STATUS_BADGE_VARIANT[position.status]} text-white`}>
                                    {t(`positions.status.${position.status}`)}
                                </span>
                                <div className="d-flex justify-content-between mt-3">
                                    <Button variant="primary">{t('positions.viewProcess')}</Button>
                                    <Button variant="secondary">{t('positions.edit')}</Button>
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
