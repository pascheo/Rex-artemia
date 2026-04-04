import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Questionnaire from './pages/user/Questionnaire';
import MyResponse from './pages/user/MyResponse';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Responses from './pages/admin/Responses';
import Report from './pages/admin/Report';

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const linkStyle = (active?: boolean): React.CSSProperties => ({
    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: active ? 700 : 400,
    padding: '6px 12px',
    borderRadius: '6px',
    background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
  });

  if (!user) return null;

  return (
    <nav style={{
      background: '#2E4057',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      height: '52px',
      flexWrap: 'wrap',
    }}>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: '15px', marginRight: '16px', letterSpacing: '-0.5px' }}>
        MIA Artemia
      </span>

      {user.role === 'USER' && (
        <>
          <Link to="/questionnaire" style={linkStyle()}>Questionnaire</Link>
          <Link to="/ma-reponse" style={linkStyle()}>Ma réponse</Link>
        </>
      )}

      {user.role === 'ADMIN' && (
        <>
          <Link to="/admin/dashboard" style={linkStyle()}>Tableau de bord</Link>
          <Link to="/admin/utilisateurs" style={linkStyle()}>Utilisateurs</Link>
          <Link to="/admin/reponses" style={linkStyle()}>Réponses</Link>
          <Link to="/admin/rapport" style={linkStyle()}>Rapport</Link>
        </>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{user.nom}</span>
        <button
          onClick={handleLogout}
          style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/questionnaire" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/questionnaire" replace />;
}

function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/questionnaire" element={<PrivateRoute><Questionnaire /></PrivateRoute>} />
        <Route path="/ma-reponse" element={<PrivateRoute><MyResponse /></PrivateRoute>} />

        <Route path="/admin/dashboard" element={<PrivateRoute adminOnly><Dashboard /></PrivateRoute>} />
        <Route path="/admin/utilisateurs" element={<PrivateRoute adminOnly><Users /></PrivateRoute>} />
        <Route path="/admin/reponses" element={<PrivateRoute adminOnly><Responses /></PrivateRoute>} />
        <Route path="/admin/rapport" element={<PrivateRoute adminOnly><Report /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
