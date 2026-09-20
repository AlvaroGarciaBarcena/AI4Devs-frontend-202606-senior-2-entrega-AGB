import React from 'react';
import { Container, Table, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { PencilSquare } from 'react-bootstrap-icons';
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
    const navigate = useNavigate();
    const { data, loading, error } = useAsyncData<UnassignedCandidate[]>(getUnassignedCandidates, [], {
        fallbackErrorMessage: t('unassignedCandidates.fetchError'),
        networkErrorMessage: t('common.networkError'),
    });
    const candidates = data ?? [];

    return (
        <Container className="mt-5">
            <Link to="/" className="d-inline-block mb-3">{t('common.backToDashboard')}</Link>
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
                            <th>{t('unassignedCandidates.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.map((candidate) => (
                            // Toda la fila navega a la edición como atajo para ratón,
                            // pero el acceso "de verdad" (teclado, lector de pantalla)
                            // sigue siendo el enlace del icono: aria-label le da un
                            // nombre accesible propio, no depende del title/tooltip.
                            <tr
                                key={candidate.id}
                                onClick={() => navigate(`/candidates/${candidate.id}/edit`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>{candidate.fullName}</td>
                                <td>{candidate.email}</td>
                                <td>{new Date(candidate.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <Link
                                        to={`/candidates/${candidate.id}/edit`}
                                        aria-label={t('unassignedCandidates.edit')}
                                        title={t('unassignedCandidates.edit')}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <PencilSquare aria-hidden="true" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default UnassignedCandidates;
