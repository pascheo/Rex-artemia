import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../api/client';

interface User {
  id: string;
  email: string;
  nom: string;
  direction: string;
  role: string;
  isActive: boolean;
  hasResponded: boolean;
  respondedAt: string | null;
}

interface CreateForm {
  email: string;
  nom: string;
  direction: string;
  password: string;
}

interface ResetForm {
  password: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register: regCreate, handleSubmit: hsCreate, reset: resetCreate, formState: { errors: errsCreate } } = useForm<CreateForm>();
  const { register: regReset, handleSubmit: hsReset, reset: resetResetForm } = useForm<ResetForm>();

  const load = () => {
    setLoading(true);
    api.get<User[]>('/admin/users').then(setUsers).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onCreate = async (data: CreateForm) => {
    setError('');
    try {
      await api.post('/admin/users', data);
      setSuccess('Utilisateur créé avec succès.');
      setShowCreate(false);
      resetCreate();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const onToggle = async (user: User) => {
    setError('');
    try {
      await api.patch(`/admin/users/${user.id}`, { isActive: !user.isActive });
      setSuccess(`Compte ${!user.isActive ? 'activé' : 'désactivé'}.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const onReset = async (data: ResetForm) => {
    if (!resetTarget) return;
    setError('');
    try {
      await api.post(`/admin/users/${resetTarget.id}/reset-password`, data);
      setSuccess('Mot de passe réinitialisé.');
      setResetTarget(null);
      resetResetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '13px', outline: 'none',
  };

  return (
    <div style={{ padding: '32px 20px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Gestion des utilisateurs</h1>
          <button
            onClick={() => { setShowCreate(!showCreate); setError(''); setSuccess(''); }}
            style={{ padding: '8px 20px', background: '#2E4057', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            {showCreate ? 'Annuler' : '+ Créer un compte'}
          </button>
        </div>

        {success && <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#166534' }}>{success}</div>}
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' }}>{error}</div>}

        {/* Create form */}
        {showCreate && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Nouveau compte utilisateur</h2>
            <form onSubmit={hsCreate(onCreate)}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input {...regCreate('email', { required: true })} type="email" placeholder="prenom.nom@cd78.fr" style={inputStyle} />
                  {errsCreate.email && <p style={{ color: '#ef4444', fontSize: '11px' }}>Requis</p>}
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Nom complet</label>
                  <input {...regCreate('nom', { required: true })} placeholder="Prénom Nom" style={inputStyle} />
                  {errsCreate.nom && <p style={{ color: '#ef4444', fontSize: '11px' }}>Requis</p>}
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Direction</label>
                  <input {...regCreate('direction', { required: true })} placeholder="Direction des ..." style={inputStyle} />
                  {errsCreate.direction && <p style={{ color: '#ef4444', fontSize: '11px' }}>Requis</p>}
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Mot de passe temporaire</label>
                  <input {...regCreate('password', { required: true, minLength: 6 })} type="password" placeholder="Min. 6 caractères" style={inputStyle} />
                  {errsCreate.password && <p style={{ color: '#ef4444', fontSize: '11px' }}>Min. 6 caractères</p>}
                </div>
              </div>
              <button
                type="submit"
                style={{ marginTop: '16px', padding: '8px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                Créer le compte
              </button>
            </form>
          </div>
        )}

        {/* Reset password modal */}
        {resetTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '360px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Réinitialiser le mot de passe</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>{resetTarget.nom} ({resetTarget.email})</p>
              <form onSubmit={hsReset(onReset)}>
                <input {...regReset('password', { required: true, minLength: 6 })} type="password" placeholder="Nouveau mot de passe" style={{ ...inputStyle, marginBottom: '16px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={{ flex: 1, padding: '8px', background: '#2E4057', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    Réinitialiser
                  </button>
                  <button type="button" onClick={() => setResetTarget(null)} style={{ flex: 1, padding: '8px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users table */}
        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {loading ? (
            <p style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>Chargement...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Nom', 'Email', 'Direction', 'Rôle', 'Réponse', 'Statut', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{u.nom}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#6b7280' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#6b7280' }}>{u.direction}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: u.role === 'ADMIN' ? '#fef3c7' : '#e0f2fe', color: u.role === 'ADMIN' ? '#92400e' : '#075985', borderRadius: '99px', padding: '2px 8px' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.hasResponded ? (
                        <span style={{ fontSize: '11px', color: '#166534', background: '#dcfce7', borderRadius: '99px', padding: '2px 8px' }}>
                          ✓ {u.respondedAt ? new Date(u.respondedAt).toLocaleDateString('fr-FR') : ''}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', borderRadius: '99px', padding: '2px 8px' }}>En attente</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: u.isActive ? '#166534' : '#991b1b' }}>
                        {u.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => onToggle(u)}
                          style={{ padding: '4px 10px', fontSize: '11px', background: u.isActive ? '#fee2e2' : '#dcfce7', color: u.isActive ? '#991b1b' : '#166534', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          {u.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => setResetTarget(u)}
                          style={{ padding: '4px 10px', fontSize: '11px', background: '#e0f2fe', color: '#075985', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Reset MDP
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
