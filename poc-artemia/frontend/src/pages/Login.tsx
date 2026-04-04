import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface FormData {
  email: string;
  password: string;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      await login(data.email, data.password);
      // Redirect based on role handled in App.tsx
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #2E4057 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '48px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #2E4057, #3b82f6)',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <span style={{ fontSize: '28px' }}>🤖</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a2e', marginBottom: '4px' }}>MIA Artemia</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Évaluation POC — DSI Yvelines (CD78)</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Adresse email
            </label>
            <input
              type="email"
              {...register('email', { required: 'Email requis' })}
              placeholder="prenom.nom@cd78.fr"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</p>}
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Mot de passe
            </label>
            <input
              type="password"
              {...register('password', { required: 'Mot de passe requis' })}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${errors.password ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {errors.password && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.password.message}</p>}
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#991b1b',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2E4057, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '24px' }}>
          Accès réservé aux agents du Conseil Départemental des Yvelines.<br />
          Contactez la DSI pour obtenir vos identifiants.
        </p>
      </div>
    </div>
  );
}
