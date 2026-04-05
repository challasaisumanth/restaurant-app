import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/staff/tables');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1A1208',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '1rem'
          }}>
            <div style={{ height: '0.5px', width: '60px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}></div>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C' }}></div>
            <div style={{ height: '0.5px', width: '60px', background: 'linear-gradient(90deg, #C9A84C, transparent)' }}></div>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '32px',
            color: '#C9A84C',
            letterSpacing: '2px',
            marginBottom: '6px'
          }}>
            ICE MAGIC
          </h1>
          <p style={{ fontSize: '11px', color: 'rgba(201,168,76,0.5)', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Staff Portal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#FDF8EE',
          borderRadius: '20px',
          padding: '2rem',
          border: '0.5px solid rgba(201,168,76,0.2)'
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px',
            color: '#1A1208',
            marginBottom: '6px'
          }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '12px', color: '#8A7A5A', marginBottom: '1.5rem' }}>
            Sign in to manage your restaurant
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FDECEA',
              border: '0.5px solid rgba(163,48,48,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '1rem',
              fontSize: '12px',
              color: '#A33030'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '500',
                color: '#8A7A5A',
                marginBottom: '6px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '0.5px solid rgba(201,168,76,0.3)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: '#FFFDF7',
                  color: '#1A1208',
                  outline: 'none',
                  fontFamily: "'DM Sans', sans-serif"
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '500',
                color: '#8A7A5A',
                marginBottom: '6px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '0.5px solid rgba(201,168,76,0.3)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: '#FFFDF7',
                  color: '#1A1208',
                  outline: 'none',
                  fontFamily: "'DM Sans', sans-serif"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#8A7A5A' : '#C9A84C',
                color: '#1A1208',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.5px',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '11px',
          color: 'rgba(201,168,76,0.4)'
        }}>
          Restaurant Management System
        </p>
      </div>
    </div>
  );
};

export default Login;