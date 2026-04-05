import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import Login from './pages/Login';
import CustomerMenu from './pages/CustomerMenu';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { user, loading } = useAuth();

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

  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ Customer menu — 100% public */}
        <Route path="/menu/:tableNumber" element={<CustomerMenu />} />

        {/* Login */}
        <Route
          path="/login"
          element={
            !loading && user
              ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/staff/tables'} replace />
              : <Login />
          }
        />

        {/* Staff Routes */}
        <Route path="/staff/*" element={
          <ProtectedRoute>
            <StaffDashboard />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;