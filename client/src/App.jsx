import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to restore session from localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (loggedInUser, userToken) => {
    setUser(loggedInUser);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'transparent', 
        color: '#ffffff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <h2>Restoring session...</h2>
      </div>
    );
  }

  // Router based on login state and role
  if (!user || !token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.role === 'admin') {
    return (
      <AdminDashboard 
        user={user} 
        token={token} 
        onLogout={handleLogout} 
      />
    );
  } else {
    return (
      <UserDashboard 
        user={user} 
        token={token} 
        onLogout={handleLogout} 
      />
    );
  }
}

export default App;
