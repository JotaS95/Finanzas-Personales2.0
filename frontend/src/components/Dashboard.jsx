import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService, userService } from '../services/api';
import { utils, writeFile } from 'xlsx';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

const FONDOS_PREDEFINIDOS = [
  { id: 'default', nombre: 'Puro y Simple', url: '', color: 'var(--primary)', isDark: false, preview: 'linear-gradient(135deg, #f5f6fa, #eef0fd)' },
  { id: 'bg-dark', nombre: 'Ondas de Color', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&format=webp', color: '#4f46e5', isDark: true, preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=40&w=400&format=webp' },
  { id: 'bg-neon', nombre: 'Burbujas Neón', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&format=webp', color: '#ec4899', isDark: true, preview: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=40&w=400&format=webp' },
  { id: 'bg-nature', nombre: 'Montañas Serenas', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&format=webp', color: '#d97706', isDark: false, preview: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=40&w=400&format=webp' },
  { id: 'bg-forest', nombre: 'Bosque Místico', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2000&format=webp', color: '#059669', isDark: true, preview: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=40&w=400&format=webp' },
  { id: 'bg-cyber', nombre: 'Onda Cyber', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2000&format=webp', color: '#a855f7', isDark: true, preview: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=40&w=400&format=webp' },
  { id: 'bg-stars', nombre: 'Cielo Estrellado', url: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?q=80&w=2000&format=webp', color: '#0284c7', isDark: true, preview: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?q=40&w=400&format=webp' },
  { id: 'bg-sunset', nombre: 'Atardecer Cálido', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&format=webp', color: '#ea580c', isDark: true, preview: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=40&w=400&format=webp' },
  { id: 'bg-nebula', nombre: 'Nebulosa Púrpura', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&format=webp', color: '#9333ea', isDark: true, preview: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=40&w=400&format=webp' }
];

const Dashboard = ({ user, userData, onLogout, onRefresh }) => {
  const [description, setDescription] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('gasto');
  const [presupuestoInput, setPresupuestoInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { transacciones, presupuesto, fondo } = userData;

  useEffect(() => {
    aplicarFondo(fondo || 'default');
  }, [fondo]);

  const aplicarFondo = (idFondo) => {
    let selected = FONDOS_PREDEFINIDOS.find(f => f.id === idFondo) || FONDOS_PREDEFINIDOS[0];
    
    if (selected.id !== 'default') {
      document.body.style.backgroundImage = `url(${selected.url})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.classList.add("has-custom-bg");
      
      document.documentElement.style.setProperty('--dynamic-accent', selected.color);
      if (selected.isDark) {
        document.documentElement.style.setProperty('--dynamic-text', '#ffffff');
        document.documentElement.style.setProperty('--dynamic-surface', 'rgba(255, 255, 255, 0.12)');
        document.documentElement.style.setProperty('--dynamic-subtext', 'rgba(255, 255, 255, 0.7)');
      } else {
        document.documentElement.style.setProperty('--dynamic-text', '#0d1117');
        document.documentElement.style.setProperty('--dynamic-surface', 'rgba(0, 0, 0, 0.1)');
        document.documentElement.style.setProperty('--dynamic-subtext', 'rgba(0, 0, 0, 0.6)');
      }
    } else {
      document.body.style.backgroundImage = "";
      document.body.classList.remove("has-custom-bg");
      document.documentElement.style.removeProperty('--dynamic-accent');
      document.documentElement.style.removeProperty('--dynamic-text');
      document.documentElement.style.removeProperty('--dynamic-surface');
      document.documentElement.style.removeProperty('--dynamic-subtext');
    }
  };

  const totalIngresos = transacciones.filter(t => t.tipo === "ingreso").reduce((acc, t) => acc + t.monto, 0);
  const totalGastos = transacciones.filter(t => t.tipo === "gasto").reduce((acc, t) => acc + t.monto, 0);
  const balance = presupuesto + totalIngresos - totalGastos;

  const categoriasSugeridas = [
    "Supermercado", "Alquiler", "Sueldo", "Transporte", "Ocio", 
    "Salud", "Educación", "Servicios", "Regalos", "Inversiones"
  ];

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!description || !monto) {
      return Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Por favor, completá todos los campos para registrar el movimiento.',
      });
    }
    
    const nueva = {
      id: Date.now(),
      descripcion: description,
      monto: parseFloat(monto.toString().replace(',', '.')),
      tipo: tipo
    };

    const updatedTransacciones = [...transacciones, nueva];
    await dataService.saveData(user, { transacciones: updatedTransacciones });
    Toast.fire({
      icon: 'success',
      title: 'Movimiento registrado'
    });
    setDescription('');
    setMonto('');
    onRefresh();
  };

  const handleDeleteTransaction = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar transacción?',
      text: "Esta acción no se puede revertir.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef233c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const updated = transacciones.filter(t => t.id !== id);
      await dataService.saveData(user, { transacciones: updated });
      onRefresh();
      Toast.fire({
        icon: 'success',
        title: 'Transacción eliminada'
      });
    }
  };

  const handleUpdatePresupuesto = async () => {
    const val = parseFloat(presupuestoInput.replace(',', '.'));
    if (isNaN(val) || val < 0) {
      return Swal.fire({
        icon: 'error',
        title: 'Monto inválido',
        text: 'Ingresá un número válido para el presupuesto.',
      });
    }
    await dataService.saveData(user, { presupuesto: val });
    Swal.fire({
      icon: 'success',
      title: 'Presupuesto actualizado',
      timer: 1500,
      showConfirmButton: false
    });
    setPresupuestoInput('');
    onRefresh();
  };

  const handleCleanData = async () => {
    const result = await Swal.fire({
      title: '¿Limpieza Total?',
      text: "Se borrarán todos tus datos (historial y presupuesto). ¡Este proceso es irreversible!",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef233c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await dataService.saveData(user, { transacciones: [], presupuesto: 0 });
      onRefresh();
      Swal.fire(
        '¡Limpiado!',
        'Tu billetera está como nueva.',
        'success'
      );
    }
  };

  const handleChangeBg = () => {
    const currentFondoId = fondo || 'default';
    const html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; margin-top: 10px;">
        ${FONDOS_PREDEFINIDOS.map(f => `
          <div class="fondo-option" data-id="${f.id}" style="
            border-radius: 12px; height: 90px; cursor: pointer;
            background: ${f.preview.startsWith('http') ? `url('${f.preview}') center/cover` : f.preview};
            border: 3px solid ${currentFondoId === f.id ? 'var(--primary)' : 'transparent'};
            transition: transform 0.2s, border-color 0.2s;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            position: relative; overflow: hidden;
          ">
            <div style="position: absolute; bottom: 0; left:0; right:0; padding: 4px; background: rgba(0,0,0,0.6); color: white; font-size: 0.75rem; text-align: center;">
              ${f.nombre}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    Swal.fire({
      title: "Seleccioná tu Fondo",
      html: html,
      showConfirmButton: false,
      showCloseButton: true,
      width: '600px',
      didOpen: () => {
        const el = Swal.getHtmlContainer();
        const options = el.querySelectorAll('.fondo-option');
        options.forEach(opt => {
          opt.onclick = async () => {
            const id = opt.getAttribute('data-id');
            await dataService.saveData(user, { fondo: id });
            onRefresh();
            Swal.close();
          };
        });
      }
    });
  };

  const exportToExcel = (filename, data) => {
    const worksheet = utils.json_to_sheet(data.map(t => ({
      Fecha: new Date(t.id).toLocaleDateString() + ' ' + new Date(t.id).toLocaleTimeString(),
      Descripción: t.descripcion,
      Tipo: t.tipo,
      Monto: t.monto
    })));
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Transacciones");
    writeFile(workbook, `Billetera_${filename}.xlsx`);
  };

  const pctUsado = presupuesto > 0 ? Math.round((totalGastos / (presupuesto + totalIngresos)) * 100) : 0;
  const restante = (presupuesto + totalIngresos) - totalGastos;

  return (
    <div id="app-screen" style={{ display: 'block' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="hamburger-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
          <span className="navbar-brand">💼 Billetera</span>
        </div>
        
        <div className="navbar-user">
          <button className="btn-fondo" onClick={handleChangeBg}>
            <span>🖼️ Fondo</span>
          </button>
          <div className="avatar" id="avatar-inicial">
            {user.charAt(0).toUpperCase()}
          </div>
          <span id="navbar-nombre">{user}</span>
          <button className="btn-logout" onClick={onLogout}>Salir</button>
        </div>
      </nav>

      <div className="app-container">
        {/* Historial Sidebar */}
        <aside className={`sidebar-historial ${isMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <p className="card-title" style={{ margin: 0, border: 'none', padding: 0 }}>📋 Historial</p>
              <button 
                className="btn-export-all" 
                onClick={() => exportToExcel(`Reporte_${user}`, transacciones)}
                title="Exportar TODO a Excel"
              >
                <svg className="excel-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 3.5 18.5 8H14V3.5zM12 11h2v2h-2v-2H8v-2h2v-2h2v2z" />
                </svg>
                <span>Exportar</span>
              </button>
            </div>
          </div>
          <div className="history-list" id="contenedor-transacciones">
            {transacciones.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📋</div>
                <p>Sin movimientos aún</p>
              </div>
            ) : (
              transacciones.slice().reverse().map(t => (
                <div key={t.id} className={`mov-card ${t.tipo}`}>
                  <div className="mov-icon">{t.tipo === 'gasto' ? '💸' : '💰'}</div>
                  <div className="mov-info">
                    <div className="mov-descripcion">{t.descripcion}</div>
                    <div className="mov-meta">
                      <span className="mov-tipo">{t.tipo}</span>
                      <span className="mov-hora">{new Date(t.id).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mov-monto">
                    {t.tipo === 'gasto' ? '-' : '+'}${t.monto.toLocaleString()}
                  </div>
                  <button className="btn-del" onClick={() => handleDeleteTransaction(t.id)}>×</button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Overlay (solo móvil) para cerrar el menú al hacer click afuera */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sidebar-overlay"
              onClick={() => setIsMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                zIndex: 35,
                backdropFilter: 'blur(4px)'
              }}
            />
          )}
        </AnimatePresence>

        {/* Contenido Principal */}
        <main className="main-content">
          <div className="stats-grid">
            <div className="stat-card principal">
              <div className="stat-label">Balance Actual</div>
              <div className={`stat-valor ${balance >= 0 ? 'valor-positivo' : 'valor-negativo'}`} id="balance-valor">
                ${balance.toLocaleString()}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏦</div>
              <div className="stat-label">Presupuesto</div>
              <div className="stat-valor" id="presupuesto-valor">${presupuesto.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-label">Ingresos</div>
              <div className="stat-valor valor-positivo" id="total-ingresos">+${totalIngresos.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📉</div>
              <div className="stat-label">Gastos</div>
              <div className="stat-valor valor-negativo" id="total-gastos">-${totalGastos.toLocaleString()}</div>
            </div>
          </div>

          {/* Configuración Presupuesto */}
          <div className="card">
            <p className="card-title">💰 Definir Presupuesto</p>
            <div className="form-row-presupuesto">
              <div style={{ flex: 1 }}>
                <input 
                  type="text" 
                  placeholder="Ej: 50000" 
                  value={presupuestoInput}
                  onChange={(e) => setPresupuestoInput(e.target.value)}
                />
                <small className="input-hint">Ingresá el monto sin puntos de miles (ej: 5000)</small>
              </div>
              <button className="btn-secondary" onClick={handleUpdatePresupuesto}>Guardar</button>
            </div>
          </div>

          {/* Barra de Progreso */}
          {(presupuesto > 0 || totalIngresos > 0) && (
            <div className="card" id="card-progreso">
              <div className="progreso-header">
                <span className="card-title" style={{ margin: 0, border: 'none', padding: 0 }}>📊 Uso del Presupuesto</span>
                <span className="progreso-restante" id="progreso-restante-label">
                  ${restante.toLocaleString()} restantes
                </span>
              </div>
              <div className="barra-container">
                <div 
                  className="barra-fill" 
                  style={{ 
                    width: `${Math.min(pctUsado, 100)}%`,
                    backgroundColor: pctUsado > 90 ? '#ef233c' : '#06c270'
                  }}
                ></div>
              </div>
              <div className="progreso-footer">
                <span id="progreso-pct">{pctUsado}% usado</span>
                <span id="progreso-total">Total disp: ${(presupuesto + totalIngresos).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Formulario Nueva Transacción */}
          <div className="card">
            <p className="card-title">＋ Nueva Transacción</p>
            <form onSubmit={handleAddTransaction} id="formulario-gastos">
              <div className="form-row">
                <input 
                  type="text" 
                  placeholder="Descripción (ej: Supermercado)" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  list="categorias-lista"
                />
                <datalist id="categorias-lista">
                  {categoriasSugeridas.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>
              <div className="form-row form-row-2">
                <div>
                  <input 
                    type="text" 
                    placeholder="Ej: 1250.50" 
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                  />
                  <small className="input-hint">Usá solo números (punto para decimales)</small>
                </div>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="gasto">💸 Gasto</option>
                  <option value="ingreso">💰 Ingreso</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Registrar Movimiento</button>
            </form>
          </div>

          {/* Zona Peligrosa */}
          <div className="card">
            <p className="card-title">⚠️ Zona Peligrosa</p>
            <button className="btn-danger-outline" onClick={handleCleanData} style={{ width: '100%' }}>
              🧹 Limpieza Inteligente de Datos
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
