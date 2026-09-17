import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './services/apiClient';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RecruiterDashboard from './components/RecruiterDashboard';
import AddCandidate from './components/AddCandidateForm';
import Positions from './components/Positions';
import PositionProcess from './components/PositionProcess';
import LanguageSwitcher from './components/LanguageSwitcher';
import Login from './components/Login';
import RequireAuth from './components/RequireAuth';
import UserMenu from './components/UserMenu';
import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex justify-content-end align-items-center gap-3 p-2">
          <UserMenu />
          <LanguageSwitcher />
        </div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><RecruiterDashboard /></RequireAuth>} />
          <Route path="/add-candidate" element={<RequireAuth><AddCandidate /></RequireAuth>} />
          <Route path="/positions" element={<RequireAuth><Positions /></RequireAuth>} />
          <Route path="/positions/:id" element={<RequireAuth><PositionProcess /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
