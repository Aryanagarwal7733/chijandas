import React, { useState } from 'react';
import { ShoppingBag, Key, Mail, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('user'); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? `${API_URL}/auth/register` : `${API_URL}/auth/login`;
    const payload = isRegister 
      ? { username, email, password, role } 
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Success
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server. Make sure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestCredentials = (type) => {
    if (type === 'admin') {
      setEmail('aryanagarwal610@gmail.com');
      setPassword('7teSy0@1');
      setRole('admin');
    } else {
      setEmail('user@chijandas.com');
      setPassword('user123');
      setRole('user');
    }
    setIsRegister(false);
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <ShoppingBag size={28} />
          </div>
          <h2 className="auth-title">Chijandas Grocery</h2>
          <p className="auth-subtitle">Inventory Management System</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} className="search-icon" style={{ left: '16px' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter your name" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                  style={{ paddingLeft: '44px', width: '100%' }}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} className="search-icon" style={{ left: '16px' }} />
              <input 
                type="email" 
                className="form-input" 
                placeholder="you@chijandas.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                style={{ paddingLeft: '44px', width: '100%' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} className="search-icon" style={{ left: '16px' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                style={{ paddingLeft: '44px', paddingRight: '40px', width: '100%' }}
              />
              <div 
                style={{ 
                  position: 'absolute', 
                  right: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  cursor: 'pointer', 
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <span className="auth-link" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
              {isRegister ? 'Sign In' : 'Register Here'}
            </span>
          </p>
          
          {!isRegister && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Test Accounts (Quick Login):</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleTestCredentials('admin')}>
                  Admin Demo
                </button>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleTestCredentials('user')}>
                  User Demo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
