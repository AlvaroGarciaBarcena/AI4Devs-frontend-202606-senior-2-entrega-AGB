import React, { Suspense, lazy } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './services/apiClient';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LanguageSwitcher from './components/LanguageSwitcher';
import Login from './components/Login';
import RequireAuth from './components/RequireAuth';
import UserMenu from './components/UserMenu';
import { AuthProvider } from './context/AuthContext';
import { useTranslation } from 'react-i18next';

// Las 4 rutas protegidas se cargan bajo demanda (code splitting): su
// código no forma parte del bundle inicial, así que a quien todavía no
// ha iniciado sesión (siempre aterriza en /login vía RequireAuth) no le
// llega ni una línea de AddCandidateForm, Positions, PositionProcess ni
// de su dependencia más pesada, react-datepicker.
//
// Login se mantiene con import estático a propósito: es la primera
// pantalla que ve todo el mundo sin sesión, y quedar detrás de un
// Suspense metería un parpadeo de carga en el primer contacto con la
// app, justo donde menos conviene.
const RecruiterDashboard = lazy(() => import('./components/RecruiterDashboard'));
const AddCandidate = lazy(() => import('./components/AddCandidateForm'));
const Positions = lazy(() => import('./components/Positions'));
const PositionProcess = lazy(() => import('./components/PositionProcess'));

const PageFallback = () => {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="p-4">
      {t('common.loadingPage')}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex justify-content-end align-items-center gap-3 p-2">
          <UserMenu />
          <LanguageSwitcher />
        </div>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><RecruiterDashboard /></RequireAuth>} />
            <Route path="/add-candidate" element={<RequireAuth><AddCandidate /></RequireAuth>} />
            <Route path="/positions" element={<RequireAuth><Positions /></RequireAuth>} />
            <Route path="/positions/:id" element={<RequireAuth><PositionProcess /></RequireAuth>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
