import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { userService, dataService } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    transacciones: [],
    presupuesto: 0,
    fondo: 'default'
  });

  // Check if there's a stored user in session (fake persistence for now)
  useEffect(() => {
    const storedUser = localStorage.getItem('active_user');
    if (storedUser) {
      handleLogin(storedUser);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (username) => {
    try {
      const data = await dataService.getData(username);
      setUserData(data);
      setUser(username);
      localStorage.setItem('active_user', username);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('active_user');
    setUserData({ transacciones: [], presupuesto: 0, fondo: 'default' });
  };

  const refreshData = async () => {
    if (user) {
      const data = await dataService.getData(user);
      setUserData(data);
    }
  };

  if (loading) {
    return (
      <div className="mesh-bg min-h-screen flex items-center justify-center">
        <div className="text-primary font-bold text-xl animate-pulse">Cargando Billetera...</div>
      </div>
    );
  }

  return (
    <div className={user ? "has-custom-bg" : "mesh-bg"}>
      {user ? (
        <Dashboard 
          user={user} 
          userData={userData} 
          onLogout={handleLogout} 
          onRefresh={refreshData}
        />
      ) : (
        <LoginScreen onLoginSuccess={handleLogin} />
      )}
    </div>
  );
}

export default App;
