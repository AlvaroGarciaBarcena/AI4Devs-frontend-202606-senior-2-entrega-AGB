import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RecruiterDashboard from './components/RecruiterDashboard';
import AddCandidate from './components/AddCandidateForm';
import Positions from './components/Positions';
import PositionProcess from './components/PositionProcess';
import LanguageSwitcher from './components/LanguageSwitcher';
import { LocaleProvider } from './i18n/LocaleContext';

const App = () => {
  return (
    <LocaleProvider>
      <BrowserRouter>
        <div className="d-flex justify-content-end p-2">
          <LanguageSwitcher />
        </div>
        <Routes>
          <Route path="/" element={<RecruiterDashboard />} />
          <Route path="/add-candidate" element={<AddCandidate />} /> {/* Agrega esta línea */}
          <Route path="/positions" element={<Positions />} />
          <Route path="/positions/:id" element={<PositionProcess />} />
        </Routes>
      </BrowserRouter>
    </LocaleProvider>
  );
};

export default App;
