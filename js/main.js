const App = {
    usuario: null,
    transacciones: [],
    presupuesto: 0,

    async iniciar() {
        const usuarios = StorageManager.obtenerUsuarios();
        UIManager.renderizarUsuarios(usuarios,
            (u) => this.seleccionarUsuario(u),
            (u) => this.confirmarEliminarUsuario(u)
        );

        document.getElementById("btn-ingresar").onclick = () => this.login();
        document.getElementById("input-login-usuario").onkeydown = (e) => {
            if (e.key === "Enter") this.login();
        };
    },

    login() {
        const input = document.getElementById("input-login-usuario");
        const nombre = input.value.trim();

        if (nombre === "") {
            UIManager.notificar("Ingresá tu nombre para continuar", "error");
            return;
        }

        this.seleccionarUsuario(nombre);
    },

    seleccionarUsuario(nombre) {
        this.usuario = nombre;
        StorageManager.registrarUsuario(nombre);
        this.cargarDatosUsuario();
    },

    async cargarDatosUsuario() {
        await this.cargarCategorias();

        this.transacciones = StorageManager.obtenerTransacciones(this.usuario);
        this.presupuesto = StorageManager.obtenerPresupuesto(this.usuario);

        UIManager.mostrarApp(this.usuario);
        UIManager.notificar(`¡Bienvenido, ${this.usuario}! 👋`, "info");

        this.configurarEventos();
        this.actualizarUI();
    },

    async cargarCategorias() {
        const fallback = ["Alquiler", "Sueldo", "Comida", "Transporte", "Servicios", "Venta", "Entretenimiento", "Salud"];

        try {
            const respuesta = await fetch("data/transacciones.json");
            if (!respuesta.ok) throw new Error("No se pudo cargar el JSON");
            const categorias = await respuesta.json();
            this.poblarDatalist(categorias.map(c => c.nombre));
            console.log("Categorías cargadas desde JSON:", categorias);
        } catch (error) {
            console.warn("fetch bloqueado (file://), usando categorías por defecto:", error.message);
            this.poblarDatalist(fallback);
        }
    },

    poblarDatalist(nombres) {
        const datalist = document.getElementById("lista-categorias");
        if (!datalist) return;
        datalist.innerHTML = nombres.map(n => `<option value="${n}">`).join("");
    },

    configurarEventos() {
        document.getElementById("formulario-gastos").onsubmit = (e) => this.procesarNuevaTransaccion(e);
        document.getElementById("btn-guardar-presupuesto").onclick = () => this.cambiarPresupuesto();
        document.getElementById("btn-cerrar-sesion").onclick = () => this.cerrarSesion();
        document.getElementById("btn-reiniciar-todo").onclick = () => this.solicitarLimpieza();
    },

    procesarNuevaTransaccion(e) {
        e.preventDefault();

        const descripcion = document.getElementById("input-descripcion").value.trim();
        const monto = this.parsearMonto(document.getElementById("input-monto").value);
        const tipo = document.getElementById("select-tipo").value;

        if (descripcion === "") {
            UIManager.notificar("La descripción no puede estar vacía", "error");
            return;
        }

        if (isNaN(monto) || monto <= 0) {
            UIManager.notificar("Monto inválido. Ingresá solo números (ej: 1500). No uses puntos para los miles.", "error");
            return;
        }

        const nueva = {
            id: Date.now(),
            descripcion: descripcion,
            monto: monto,
            tipo: tipo
        };

        this.transacciones.push(nueva);
        StorageManager.guardarTransacciones(this.usuario, this.transacciones);
        e.target.reset();
        UIManager.notificar("Movimiento registrado ✓");
        this.actualizarUI();
    },

    // Normalizar montos: acepta 1500 | 1500.50 | 1500,50
    parsearMonto(valor) {
        let raw = String(valor).trim();
        raw = raw.replace(",", ".");

        if (/^\d+\.\d{3}$/.test(raw)) {
            raw = raw.replace(".", "");
        }

        return parseFloat(raw);
    },

    cambiarPresupuesto() {
        const valor = this.parsearMonto(document.getElementById("input-presupuesto").value);

        if (!isNaN(valor) && valor >= 0) {
            this.presupuesto = valor;
            StorageManager.guardarPresupuesto(this.usuario, this.presupuesto);
            document.getElementById("input-presupuesto").value = "";
            UIManager.notificar("Presupuesto actualizado ✓");
            this.actualizarUI();
        } else {
            UIManager.notificar("Ingresá un valor válido", "error");
        }
    },

    eliminarTransaccion(id) {
        UIManager.confirmarAccion(
            "¿Eliminar movimiento?",
            "Esta acción no se puede deshacer.",
            () => {
                this.transacciones = this.transacciones.filter(t => t.id !== id);
                StorageManager.guardarTransacciones(this.usuario, this.transacciones);
                UIManager.notificar("Movimiento eliminado");
                this.actualizarUI();
            }
        );
    },

    solicitarLimpieza() {
        UIManager.mostrarPanelLimpieza((opcion) => {
            let mensaje = "";
            let confirmacionRequerida = true;

            switch (opcion) {
                case "historial":
                    this.transacciones = [];
                    mensaje = "Historial borrado";
                    break;
                case "presupuesto":
                    this.presupuesto = 0;
                    mensaje = "Presupuesto reiniciado a $0";
                    break;
                case "gastos":
                    this.transacciones = this.transacciones.filter(t => t.tipo === "ingreso");
                    mensaje = "Se eliminaron todos los gastos";
                    break;
                case "todo":
                    this.transacciones = [];
                    this.presupuesto = 0;
                    mensaje = "Todos los datos han sido borrados";
                    break;
            }

            if (mensaje) {
                StorageManager.guardarTransacciones(this.usuario, this.transacciones);
                StorageManager.guardarPresupuesto(this.usuario, this.presupuesto);
                UIManager.notificar(mensaje);
                this.actualizarUI();
            }
        });
    },

    confirmarEliminarUsuario(nombre) {
        UIManager.confirmarAccion(
            `¿Eliminar usuario "${nombre}"?`,
            "Se borrarán todos sus datos y el historial. Esta acción no se puede deshacer.",
            () => {
                StorageManager.eliminarUsuario(nombre);
                UIManager.notificar(`Usuario "${nombre}" eliminado`, "error");
                // Refrescar los chips
                const usuarios = StorageManager.obtenerUsuarios();
                UIManager.renderizarUsuarios(usuarios,
                    (u) => this.seleccionarUsuario(u),
                    (u) => this.confirmarEliminarUsuario(u)
                );
            }
        );
    },

    cerrarSesion() {
        this.usuario = null;
        this.transacciones = [];
        this.presupuesto = 0;
        document.getElementById("input-login-usuario").value = "";
        const usuarios = StorageManager.obtenerUsuarios();
        UIManager.renderizarUsuarios(usuarios,
            (u) => this.seleccionarUsuario(u),
            (u) => this.confirmarEliminarUsuario(u)
        );
        UIManager.mostrarLogin();
    },

    actualizarUI() {
        const { balance, totalGastos } = UIManager.actualizarStats(this.presupuesto, this.transacciones);
        UIManager.renderizarLista(this.transacciones, (id) => this.eliminarTransaccion(id));

        const pct = UIManager.actualizarProgreso(this.presupuesto, totalGastos);

        // Alertas de presupuesto solo si hay presupuesto definido
        if (this.presupuesto > 0 && pct !== undefined) {
            if (balance < 0) {
                UIManager.notificar("⛔ ¡Superaste el presupuesto!", "error");
            } else if (pct >= 90) {
                UIManager.notificar("🔴 Atención: usaste más del 90% del presupuesto", "error");
            } else if (pct >= 70 && pct < 90) {
                UIManager.notificar("🟡 Vas por el 70% del presupuesto", "info");
            }
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    App.iniciar();
});
