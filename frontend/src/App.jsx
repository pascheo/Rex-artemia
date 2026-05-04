import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import FormulairePage from './pages/FormulairePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

const styles = {
  entete: {
    backgroundColor: '#003189',
    color: '#ffffff',
    padding: '16px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titreApp: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  sousTitre: {
    margin: '4px 0 0 0',
    fontSize: '0.85rem',
    opacity: 0.85,
  },
  lienDashboard: {
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '0.85rem',
    border: '1px solid rgba(255,255,255,0.5)',
    padding: '6px 14px',
    borderRadius: '4px',
  },
  contenu: {
    minHeight: 'calc(100vh - 80px)',
    backgroundColor: '#f5f7fa',
  },
};

export default function App() {
  return (
    <BrowserRouter>
      <header style={styles.entete}>
        <div>
          <h1 style={styles.titreApp}>POC MIA Artemia — Questionnaire</h1>
          <p style={styles.sousTitre}>Conseil Départemental des Yvelines (CD78)</p>
        </div>
        <nav>
          <Link to="/dashboard" style={styles.lienDashboard}>
            Tableau de bord DSI
          </Link>
        </nav>
      </header>
      <main style={styles.contenu}>
        <Routes>
          <Route path="/" element={<FormulairePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
