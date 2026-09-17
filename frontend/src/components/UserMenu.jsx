import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

// No se renderiza nada en /login: employee es null hasta que se inicia
// sesión, y esta barra solo tiene sentido una vez autenticado.
const UserMenu = () => {
    const { t } = useTranslation();
    const { employee, logout } = useAuth();
    const navigate = useNavigate();

    if (!employee) return null;

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="d-flex align-items-center">
            <span className="me-2 small text-muted">{employee.name}</span>
            <Button type="button" size="sm" variant="outline-secondary" onClick={handleLogout}>
                {t('userMenu.logout')}
            </Button>
        </div>
    );
};

export default UserMenu;
