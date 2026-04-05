import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import Login from './pages/Login';
import CustomerMenu from './pages/CustomerMenu';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/menu/:tableNumber" element={<CustomerMenu />} />
        <Route
          path="/login"
          element={user
            ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/staff/tables'} />
            : <Login />}
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
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/menu/:id" element={<MenuPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;