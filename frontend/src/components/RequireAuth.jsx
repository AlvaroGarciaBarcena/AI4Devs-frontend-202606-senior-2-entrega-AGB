import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Envuelve las rutas que exigen sesión iniciada. Redirige a /login
// conservando la ruta que se intentaba visitar (location.state.from), para
// que Login.jsx pueda volver a ella tras autenticarse en vez de mandar
// siempre al dashboard.
const RequireAuth = ({ children }) => {
    const { employee } = useAuth();
    const location = useLocation();

    if (!employee) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default RequireAuth;
