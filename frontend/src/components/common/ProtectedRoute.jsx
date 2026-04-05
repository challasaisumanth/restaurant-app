import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  // ✅ Wait for auth to finish loading before redirecting
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1A1208',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '24px',
          color: '#C9A84C',
          letterSpacing: '2px'
        }}>
          ICE MAGIC
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/staff/tables" replace />;

  return children;
};

export default ProtectedRoute;