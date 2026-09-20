import React from 'react';
import { Container, Table, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getUnassignedCandidates } from '../services/candidateService';
import { useAsyncData } from '../hooks/useAsyncData';
import { useTranslation } from 'react-i18next';

type UnassignedCandidate = {
    id: number;
    fullName: string;
    email: string;
    createdAt: string;
};

const UnassignedCandidates: React.FC = () => {
    const { t } = useTranslation();
    const { data, loading, error } = useAsyncData<UnassignedCandidate[]>(getUnassignedCandidates, [], {
        fallbackErrorMessage: t('unassignedCandidates.fetchError'),
    });
    const candidates = data ?? [];

    return (
        <Container className="mt-5">
            <Link to="/" className="d-inline-block mb-3">{t('unassignedCandidates.back')}</Link>
            <h2 className="mb-4">{t('unassignedCandidates.title')}</h2>
            {loading && (
                <div className="text-center">
                    <Spinner animation="border" role="status" />
                </div>
            )}
            {error && <Alert variant="danger">{error}</Alert>}
            {!loading && !error && candidates.length === 0 && (
                <Alert variant="info">{t('unassignedCandidates.empty')}</Alert>
            )}
            {!loading && !error && candidates.length > 0 && (
                <Table striped hover responsive>
                    <thead>
                        <tr>
                            <th>{t('unassignedCandidates.name')}</th>
                            <th>{t('unassignedCandidates.email')}</th>
                            <th>{t('unassignedCandidates.registeredAt')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.map((candidate) => (
                            <tr key={candidate.id}>
                                <td>{candidate.fullName}</td>
                                <td>{candidate.email}</td>
                                <td>{new Date(candidate.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default UnassignedCandidates;
