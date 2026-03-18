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
    },

    // Renderizar historial agrupado por día
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

        // Agrupar por día
        const grupos = {};
        ordenadas.forEach(t => {
            const clave = this.claveDelDia(t.id);
            if (!grupos[clave]) grupos[clave] = { timestamp: t.id, items: [] };
            grupos[clave].items.push(t);
        });

        // Renderizar cada grupo
        for (const clave in grupos) {
            const grupo = grupos[clave];

            // Encabezado del día
            const header = document.createElement("div");
            header.className = "dia-header";
            header.innerHTML = `<span class="dia-label">📅 ${this.formatearFecha(grupo.timestamp)}</span>`;
            contenedor.appendChild(header);

            // Transacciones del día
            grupo.items.forEach(t => {
                const div = document.createElement("div");
                div.className = `mov-card ${t.tipo}`;
                const emoji = t.tipo === "gasto" ? "📉" : "📈";
                const signo = t.tipo === "gasto" ? "−" : "+";

                div.innerHTML = `
                    <div class="mov-icon">${emoji}</div>
                    <div class="mov-info">
                        <div class="mov-descripcion">${t.descripcion}</div>
                        <div class="mov-meta">
                            <span class="mov-tipo">${t.tipo}</span>
                            <span class="mov-hora">🕐 ${this.formatearHora(t.id)}</span>
                        </div>
                    </div>
                    <div class="mov-monto">${signo} ${this.formatearMoneda(t.monto)}</div>
                    <button class="btn-del" data-id="${t.id}" title="Eliminar">✕</button>
                `;
                contenedor.appendChild(div);
                div.querySelector(".btn-del").onclick = () => onEliminar(t.id);
            });
        }
    },

    notificar(mensaje, tipo = "success") {
        const colores = {
            success: "linear-gradient(135deg, #06c270, #00a86b)",
            error:   "linear-gradient(135deg, #ef233c, #c9184a)",
            info:    "linear-gradient(135deg, #4361ee, #3a0ca3)"
        };
        Toastify({
            text: mensaje, duration: 3000, gravity: "top", position: "right",
            style: { background: colores[tipo] || colores.success, borderRadius: "10px", fontSize: "14px", fontFamily: "'Outfit', sans-serif" }
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
