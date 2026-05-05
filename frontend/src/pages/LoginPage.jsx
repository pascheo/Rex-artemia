import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carte: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    padding: '40px 48px',
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    backgroundColor: '#003189',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '14px 20px',
    marginBottom: '28px',
    textAlign: 'center',
  },
  titreLogo: { margin: 0, fontSize: '1rem', fontWeight: 700 },
  sousTitreLogo: { margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.85 },
  titre: { fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' },
  sousTitre: { fontSize: '0.85rem', color: '#666', margin: '0 0 24px' },
  label: { display: 'block', fontWeight: 600, color: '#1a1a2e', marginBottom: '8px', fontSize: '0.9rem' },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '6px',
    border: '2px solid #003189',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    marginBottom: '20px',
    outline: 'none',
  },
  bouton: {
    width: '100%',
    backgroundColor: '#003189',
    color: '#ffffff',
    border: 'none',
    padding: '13px',
    fontSize: '1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  boutonDesactive: {
    width: '100%',
    backgroundColor: '#8fa8d4',
    color: '#ffffff',
    border: 'none',
    padding: '13px',
    fontSize: '1rem',
    borderRadius: '6px',
    cursor: 'not-allowed',
    fontWeight: 600,
  },
  erreur: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px 16px',
    borderRadius: '6px',
    fontSize: '0.88rem',
    marginBottom: '16px',
    border: '1px solid #f5c6cb',
  },
};

export default function LoginPage() {
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!motDePasse) return;
    setChargement(true);
    setErreur('');
    try {
      const reponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: motDePasse }),
      });
      const donnees = await reponse.json();
      if (reponse.ok) {
        sessionStorage.setItem('dsi_token', donnees.token);
        navigate('/dashboard');
      } else {
        setErreur(donnees.erreur || 'Mot de passe incorrect.');
      }
    } catch {
      setErreur('Impossible de joindre le serveur.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.carte}>
        <div style={styles.logo}>
          <p style={styles.titreLogo}>POC MIA Artemia</p>
          <p style={styles.sousTitreLogo}>Conseil Départemental des Yvelines (CD78)</p>
        </div>
        <h2 style={styles.titre}>Accès Dashboard DSI</h2>
        <p style={styles.sousTitre}>Espace réservé à la Direction des Systèmes d'Information.</p>
        {erreur && <div style={styles.erreur}>{erreur}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <label style={styles.label} htmlFor="motdepasse">Mot de passe DSI</label>
          <input
            id="motdepasse"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            style={styles.input}
            placeholder="••••••••"
            autoFocus
          />
          <button
            type="submit"
            style={chargement ? styles.boutonDesactive : styles.bouton}
            disabled={chargement}
          >
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
