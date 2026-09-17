import React, { useState } from 'react';
import { Form, Button, Alert, Card, Container } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await login(email, password);
            // Vuelve a la página que se intentaba visitar antes de que
            // RequireAuth redirigiera aquí (o al dashboard si se entró
            // directamente por /login).
            const redirectTo = location.state?.from?.pathname ?? '/';
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(t('login.genericErrorPrefix') + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container className="mt-5" style={{ maxWidth: '400px' }}>
            <h1 className="mb-4">{t('login.title')}</h1>
            <Card className="shadow p-4">
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="email" className="mb-3">
                        <Form.Label>{t('login.email')}</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="username"
                            aria-invalid={!!error}
                        />
                    </Form.Group>
                    <Form.Group controlId="password" className="mb-3">
                        <Form.Label>{t('login.password')}</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            aria-invalid={!!error}
                        />
                    </Form.Group>
                    {error && <Alert variant="danger" role="alert" aria-live="assertive" className="mb-3">{error}</Alert>}
                    <Button type="submit" disabled={submitting}>
                        {submitting ? t('login.submitting') : t('login.submit')}
                    </Button>
                </Form>
            </Card>
        </Container>
    );
};

export default Login;
