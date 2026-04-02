import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../services/api';
import Swal from 'sweetalert2';

const LoginScreen = ({ onLoginSuccess }) => {
  const [view, setView] = useState('initial'); // initial, login, register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await userService.getUsers();
      setRegisteredUsers(users);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return alert("Ingresá tu contraseña");
    try {
      const res = await userService.login(selectedUser, password);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Acceso Correcto!',
          text: `Bienvenido de nuevo, ${selectedUser}`,
          timer: 1500,
          showConfirmButton: false
        });
        onLoginSuccess(selectedUser);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Acceso',
        text: 'Contraseña incorrecta. Por favor, verificá tus datos.'
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password) return alert("Campos incompletos");
    if (password.length < 8) return alert("Mínimo 8 caracteres.");
    if (password !== confirmPassword) return alert("Las contraseñas no coinciden");

    try {
      const res = await userService.register(username, password);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Cuenta Creada',
          text: 'Tu usuario ha sido registrado con éxito. ¡Ya puedes empezar!',
          confirmButtonText: 'Genial'
        });
        onLoginSuccess(username);
      }
    } catch (error) {
      Swal.fire({
        icon: 'warning',
        title: 'Usuario Existente',
        text: 'Ese nombre de usuario ya está en uso. Elegí otro.'
      });
    }
  };

  const handleDeleteUser = async (userToDelete, event) => {
    event.stopPropagation();
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: `Se borrarán todos los datos asociados a ${userToDelete}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef233c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await userService.deleteUser(userToDelete);
      Swal.fire({
        icon: 'success',
        title: 'Usuario eliminado',
        timer: 1000,
        showConfirmButton: false
      });
      loadUsers();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div id="login-screen">
      {/* Panel de Presentación Izquierdo */}
      <div className="login-presentation">
        <div className="presentation-advice">
          <div className="advice-icon">💡</div>
          <div className="advice-content">
            <strong>CONSEJO:</strong>
            ¿Quieres tener el control real de tu plata? Usa esta billetera para registrar lo que gastas día a día, y descubre en qué se te va el sueldo. ¡Es el primer paso hacia la tranquilidad financiera!
          </div>
        </div>

        <h1 className="presentation-title">Tus finanzas,<br />bajo control.</h1>
        <p className="presentation-subtitle">Tu Billetera Virtual rápida, privada y estéticamente moderna.</p>
        
        <div className="presentation-features">
          <div className="feature-item">
            <div className="feature-icon">🔒</div>
            <div>
              <strong>100% Segura</strong>
              <p>Encriptación local y personal multiplataforma.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <div>
              <strong>Monitoreo Preciso</strong>
              <p>Analizá tus ingresos, gastos y presupuesto al instante.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🎨</div>
            <div>
              <strong>Altamente Personalizable</strong>
              <p>Adaptá la interfaz con diseño Glassmorphism único.</p>
            </div>
          </div>
        </div>
        
        <div className="presentation-footer">
          <img src="/img/zaviso-brand-mark.jpg" alt="Zaviso" className="footer-logo" />
          <span>Desarrollado por <strong>Zaviso</strong></span>
        </div>
      </div>

      <div className="login-box-wrapper">
        <div className="login-box">
          <AnimatePresence mode="wait">
            {view === 'initial' && (
              <motion.div 
                key="initial"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                id="vista-inicial"
              >
                <div className="login-logo">💼</div>
                <h2>Billetera Virtual</h2>
                <p className="login-subtitle">Tu gestor de finanzas personales</p>

                {registeredUsers.length > 0 && (
                  <div id="usuarios-existentes">
                    <p className="usuarios-lista-titulo">Seleccioná tu usuario</p>
                    <div className="usuarios-chips">
                      {registeredUsers.map(u => (
                        <div key={u} className="chip-usuario">
                          <span onClick={() => { setSelectedUser(u); setView('login'); }}>{u}</span>
                          <button className="chip-del" onClick={(e) => handleDeleteUser(u, e)}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="login-divisor">
                  <span>o</span>
                </div>

                <button className="btn-login btn-register-outline" onClick={() => setView('register')}>＋ Crear cuenta nueva</button>
              </motion.div>
            )}

            {view === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLogin}
                id="vista-login"
              >
                <button type="button" className="btn-back" onClick={() => setView('initial')}>← Volver</button>
                <div className="login-logo">👤</div>
                <h2 id="login-nombre-titulo">{selectedUser}</h2>
                <p className="login-subtitle">Ingresá tu contraseña para continuar</p>

                <div className="login-form-group">
                  <label>Contraseña</label>
                  <div className="password-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                    <button type="button" className="btn-toggle-pass" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? "👁️" : "👁️"}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-login">Ingresar →</button>
              </motion.form>
            )}

            {view === 'register' && (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                id="vista-registro"
              >
                <button type="button" className="btn-back" onClick={() => setView('initial')}>← Volver</button>
                <div className="login-logo">✨</div>
                <h2>Nueva cuenta</h2>
                <p className="login-subtitle">Creá tu usuario y elegí un PIN</p>

                <div className="login-form-group">
                  <label>Nombre de usuario</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Jonathan" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="login-form-group">
                  <label>Crear contraseña (mín. 8 caracteres)</label>
                  <div className="password-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Mín. 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" className="btn-toggle-pass" onClick={() => setShowPassword(!showPassword)}>
                      👁️
                    </button>
                  </div>
                </div>

                <div className="login-form-group">
                  <label>Confirmar PIN</label>
                  <div className="password-wrapper">
                    <input 
                      type="password" 
                      placeholder="Repetí la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-login">Crear cuenta →</button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
