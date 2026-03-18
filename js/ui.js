/**
 * ui.js - Manipulación del DOM y Renderizado
 */

const UIManager = {

    formatearMoneda(valor) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency', currency: 'ARS', minimumFractionDigits: 2
        }).format(valor);
    },

    formatearFecha(timestamp) {
        const fecha = new Date(timestamp);
        return fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    },

    formatearHora(timestamp) {
        const fecha = new Date(timestamp);
        return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    },

    // Obtener clave de día para agrupar (ej: "18/03/2026")
    claveDelDia(timestamp) {
        const f = new Date(timestamp);
        return `${f.getDate().toString().padStart(2,'0')}/${(f.getMonth()+1).toString().padStart(2,'0')}/${f.getFullYear()}`;
    },

    mostrarLogin() {
        document.getElementById("login-screen").style.display = "flex";
        document.getElementById("app-screen").style.display = "none";
    },

    mostrarApp(usuario) {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("app-screen").style.display = "block";
        document.getElementById("navbar-nombre").innerText = usuario;
        document.getElementById("avatar-inicial").innerText = usuario.charAt(0).toUpperCase();
    },

    // Renderizar chips de usuarios con botón de eliminar
    renderizarUsuarios(usuarios, onLoginChip, onEliminarUsuario) {
        const contenedor = document.getElementById("usuarios-existentes");
        const chips = document.getElementById("chips-container");

        if (usuarios.length === 0) {
            contenedor.style.display = "none";
            return;
        }

        contenedor.style.display = "block";
        chips.innerHTML = "";

        usuarios.forEach(u => {
            const chip = document.createElement("div");
            chip.className = "chip-usuario";

            const nombre = document.createElement("span");
            nombre.textContent = u;
            nombre.onclick = () => onLoginChip(u);

            const btnDel = document.createElement("button");
            btnDel.className = "chip-del";
            btnDel.innerHTML = "✕";
            btnDel.title = `Eliminar usuario ${u}`;
            btnDel.onclick = (e) => {
                e.stopPropagation();
                onEliminarUsuario(u);
            };

            chip.appendChild(nombre);
            chip.appendChild(btnDel);
            chips.appendChild(chip);
        });
    },

    // Actualizar tarjetas de estadísticas
    actualizarStats(presupuesto, transacciones) {
        const totalIngresos = transacciones.filter(t => t.tipo === "ingreso").reduce((acc, t) => acc + t.monto, 0);
        const totalGastos   = transacciones.filter(t => t.tipo === "gasto").reduce((acc, t) => acc + t.monto, 0);
        const balance = presupuesto + totalIngresos - totalGastos;

        const elBalance = document.getElementById("balance-valor");
        elBalance.innerText = this.formatearMoneda(balance);
        elBalance.className = "stat-valor " + (balance < 0 ? "valor-negativo" : "valor-positivo");

        document.getElementById("presupuesto-valor").innerText = this.formatearMoneda(presupuesto);
        document.getElementById("total-ingresos").innerText = this.formatearMoneda(totalIngresos);
        document.getElementById("total-gastos").innerText = this.formatearMoneda(totalGastos);

        return { balance, totalGastos, totalIngresos };
    },

    // Actualizar la barra de progreso del presupuesto
    actualizarProgreso(presupuesto, totalGastos) {
        const card = document.getElementById("card-progreso");
        if (presupuesto <= 0) { card.style.display = "none"; return; }

        card.style.display = "block";

        const porcentajeUsado = Math.min((totalGastos / presupuesto) * 100, 100);
        const restante = presupuesto - totalGastos;

        // Color de la barra según uso
        let colorBarra = "#06c270"; // verde
        if (porcentajeUsado >= 90) colorBarra = "#ef233c";       // rojo
        else if (porcentajeUsado >= 70) colorBarra = "#d29922";  // naranja

        const barra = document.getElementById("barra-fill");
        barra.style.width = `${porcentajeUsado}%`;
        barra.style.background = colorBarra;

        document.getElementById("progreso-pct").innerText = `${Math.round(porcentajeUsado)}% usado`;
        document.getElementById("progreso-total").innerText = `de ${this.formatearMoneda(presupuesto)}`;
        document.getElementById("progreso-restante-label").innerText =
            restante >= 0
            ? `${this.formatearMoneda(restante)} disponibles`
            : `${this.formatearMoneda(Math.abs(restante))} sobre el presupuesto`;
        document.getElementById("progreso-restante-label").style.color =
            restante < 0 ? "var(--danger)" : restante < presupuesto * 0.1 ? "var(--warning)" : "var(--success)";

        return porcentajeUsado;
    },

    // Renderizar historial agrupado por Mes -> Día
    renderizarLista(transacciones, onEliminar) {
        const contenedor = document.getElementById("contenedor-transacciones");
        if (!contenedor) return;

        contenedor.innerHTML = "";

        if (transacciones.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📊</div>
                    <p>No hay movimientos registrados todavía.</p>
                </div>`;
            return;
        }

        // Ordenar del más reciente al más antiguo
        const ordenadas = [...transacciones].sort((a, b) => b.id - a.id);

        // Agrupar jerárquicamente: Mes -> Día -> Items
        const meses = {};
        
        ordenadas.forEach(t => {
            const fecha = new Date(t.id);
            const claveMes = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            // Formato: "marzo 2026"
            const nombreMes = fecha.toLocaleString("es-AR", { month: "long", year: "numeric" });
            
            if (!meses[claveMes]) {
                meses[claveMes] = { nombre: nombreMes, dias: {} };
            }

            const claveDia = this.claveDelDia(t.id);
            if (!meses[claveMes].dias[claveDia]) {
                meses[claveMes].dias[claveDia] = { timestamp: t.id, items: [] };
            }
            meses[claveMes].dias[claveDia].items.push(t);
        });

        // Renderizar Meses
        Object.keys(meses).forEach((claveMes, index) => {
            const mes = meses[claveMes];
            
            const mesBlock = document.createElement("div");
            mesBlock.className = "mes-grupo";
            
            // Header del Mes (Carpeta)
            const mesHeader = document.createElement("div");
            // El más reciente (index 0) empieza abierto
            mesHeader.className = `mes-header ${index === 0 ? "abierto" : "cerrado"}`;
            mesHeader.innerHTML = `
                <span>${mes.nombre}</span>
                <span class="toggle-icon">▼</span>
            `;
            
            const mesContenido = document.createElement("div");
            mesContenido.className = "mes-contenido";
            
            // Evento colapsar
            mesHeader.onclick = () => {
                const isCerrado = mesHeader.classList.contains("cerrado");
                mesHeader.classList.toggle("cerrado", !isCerrado);
                mesHeader.classList.toggle("abierto", isCerrado);
            };

            // Renderizar Días dentro del Mes
            Object.keys(mes.dias).forEach(claveDia => {
                const grupoDia = mes.dias[claveDia];

                // Fila del Día
                const diaHeader = document.createElement("div");
                diaHeader.className = "dia-header";
                diaHeader.innerHTML = `<span class="dia-label">📅 ${this.formatearFecha(grupoDia.timestamp)}</span>`;
                mesContenido.appendChild(diaHeader);

                // Movimientos
                grupoDia.items.forEach(t => {
                    const item = document.createElement("div");
                    item.className = `history-item ${t.tipo}`;
                    
                    const signo = t.tipo === "gasto" ? "-" : "+";

                    item.innerHTML = `
                        <div class="mov-info">
                            <span class="mov-desc">${t.descripcion}</span>
                            <div class="mov-meta">
                                <span class="mov-tipo">${t.tipo}</span>
                                <span class="mov-hora">🕐 ${this.formatearHora(t.id)}</span>
                            </div>
                        </div>
                        <div class="mov-acciones">
                            <span class="mov-monto">${signo}${this.formatearMoneda(t.monto)}</span>
                            <button class="btn-del" title="Eliminar fila">✕</button>
                        </div>
                    `;
                    item.querySelector(".btn-del").onclick = () => onEliminar(t.id);
                    mesContenido.appendChild(item);
                });
            });

            mesBlock.appendChild(mesHeader);
            mesBlock.appendChild(mesContenido);
            contenedor.appendChild(mesBlock);
        });
    },

    notificar(mensaje, tipo = "success") {
        const colores = {
            success: "linear-gradient(135deg, #06c270, #00a86b)",
            error:   "linear-gradient(135deg, #ef233c, #c9184a)",
            info:    "linear-gradient(135deg, #4361ee, #3a0ca3)"
        };

        // Las alertas de presupuesto (info/error) duran más (8s), las de éxito menos (4s)
        const duracion = (tipo === "success") ? 4000 : 8000;

        Toastify({
            text: mensaje, 
            duration: duracion, 
            gravity: "top", 
            position: "right",
            style: { 
                background: colores[tipo] || colores.success, 
                borderRadius: "10px", 
                fontSize: "14px", 
                fontFamily: "'Outfit', sans-serif" 
            }
        }).showToast();
    },

    confirmarAccion(titulo, texto, callback) {
        Swal.fire({
            title: titulo, text: texto, icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef233c",
            cancelButtonColor: "#8892a4",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        }).then(result => { if (result.isConfirmed) callback(); });
    }
};
