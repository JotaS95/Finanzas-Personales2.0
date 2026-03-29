const App = {
    usuario: null,
    transacciones: [],
    presupuesto: 0,
    _usuarioLoginActual: null,

    async iniciar() {
        this._renderizarChips();

        // Navegación entre vistas
        document.getElementById("btn-ir-registro").onclick    = () => this.mostrarVistaRegistro();
        document.getElementById("btn-volver-login").onclick   = () => this.mostrarVistaInicial();
        document.getElementById("btn-volver-registro").onclick= () => this.mostrarVistaInicial();
        document.getElementById("btn-ingresar").onclick       = () => this.login();
        document.getElementById("btn-crear-cuenta").onclick   = () => this.crearCuenta();

        // Enter en campos
        document.getElementById("input-password").onkeydown       = (e) => { if (e.key === "Enter") this.login(); };
        document.getElementById("input-login-usuario").onkeydown  = (e) => { if (e.key === "Enter") document.getElementById("input-new-password").focus(); };
        document.getElementById("input-new-password").onkeydown   = (e) => { if (e.key === "Enter") document.getElementById("input-confirm-password").focus(); };
        document.getElementById("input-confirm-password").onkeydown = (e) => { if (e.key === "Enter") this.crearCuenta(); };

        // Solo números en PIN — removido (ahora se permiten letras y números)
        // El filtrado ya no es necesario con la nueva política de contraseñas

        // Toggle mostrar/ocultar contraseña
        const toggles = {
            "btn-toggle-pass":         "input-password",
            "btn-toggle-new-pass":     "input-new-password",
            "btn-toggle-confirm-pass": "input-confirm-password",
        };
        Object.entries(toggles).forEach(([btnId, inpId]) => {
            document.getElementById(btnId).onclick = () => {
                const inp = document.getElementById(inpId);
                inp.type = inp.type === "password" ? "text" : "password";
            };
        });
    },

    // ─── VISTAS ───────────────────────────────────────────────

    mostrarVistaInicial() {
        document.getElementById("vista-inicial").style.display  = "block";
        document.getElementById("vista-login").style.display    = "none";
        document.getElementById("vista-registro").style.display = "none";
        // Limpiar campos
        document.getElementById("input-password").value         = "";
        document.getElementById("input-new-password").value     = "";
        document.getElementById("input-confirm-password").value = "";
        document.getElementById("input-login-usuario").value    = "";
        this._usuarioLoginActual = null;
        this._renderizarChips();
    },

    mostrarVistaLogin(nombre) {
        this._usuarioLoginActual = nombre;
        document.getElementById("vista-inicial").style.display  = "none";
        document.getElementById("vista-login").style.display    = "block";
        document.getElementById("vista-registro").style.display = "none";
        document.getElementById("login-nombre-titulo").textContent = nombre;
        document.getElementById("input-password").value = "";
        document.getElementById("input-password").focus();
    },

    mostrarVistaRegistro() {
        document.getElementById("vista-inicial").style.display  = "none";
        document.getElementById("vista-login").style.display    = "none";
        document.getElementById("vista-registro").style.display = "block";
        document.getElementById("input-login-usuario").value    = "";
        document.getElementById("input-new-password").value     = "";
        document.getElementById("input-confirm-password").value = "";
        document.getElementById("input-login-usuario").focus();
    },

    // ─── ACCIONES ─────────────────────────────────────────────

    async login() {
        const nombre   = this._usuarioLoginActual;
        const password = document.getElementById("input-password").value;

        if (!nombre) return;

        if (password === "") {
            UIManager.notificar("Ingresá tu PIN para continuar", "error");
            document.getElementById("input-password").focus();
            return;
        }

        const ok = await StorageManager.verificarPassword(nombre, password);
        if (!ok) {
            UIManager.notificar("❌ PIN incorrecto", "error");
            document.getElementById("input-password").value = "";
            document.getElementById("input-password").focus();
            return;
        }
        this.seleccionarUsuario(nombre);
    },

    async crearCuenta() {
        const nombre   = document.getElementById("input-login-usuario").value.trim();
        const password = document.getElementById("input-new-password").value;
        const confirm  = document.getElementById("input-confirm-password").value;

        if (nombre === "") {
            UIManager.notificar("Ingresá un nombre de usuario", "error");
            document.getElementById("input-login-usuario").focus();
            return;
        }

        const usuarios = StorageManager.obtenerUsuarios();
        if (usuarios.includes(nombre)) {
            UIManager.notificar("Ese nombre ya existe. Elegí otro.", "error");
            document.getElementById("input-login-usuario").focus();
            return;
        }

        if (password === "") {
            UIManager.notificar("Elegí un PIN de 4 a 6 dígitos", "error");
            document.getElementById("input-new-password").focus();
            return;
        }
        if (password.length < 8) {
            UIManager.notificar("La contraseña debe tener al menos 8 caracteres", "error");
            return;
        }
        if (!/[a-zA-Z]/.test(password)) {
            UIManager.notificar("La contraseña debe contener al menos una letra", "error");
            return;
        }
        if (!/[0-9]/.test(password)) {
            UIManager.notificar("La contraseña debe contener al menos un número", "error");
            return;
        }
        if (password !== confirm) {
            UIManager.notificar("Los PIN no coinciden", "error");
            document.getElementById("input-confirm-password").value = "";
            document.getElementById("input-confirm-password").focus();
            return;
        }

        await StorageManager.guardarPassword(nombre, password);
        UIManager.notificar("✅ Cuenta creada exitosamente", "success");
        this.seleccionarUsuario(nombre);
    },

    // Login desde chip
    seleccionarUsuarioDesdeChip(nombre) {
        if (!StorageManager.tienePassword(nombre)) {
            this.seleccionarUsuario(nombre);
            return;
        }
        this.mostrarVistaLogin(nombre);
    },

    seleccionarUsuario(nombre) {
        this.usuario = nombre;
        StorageManager.registrarUsuario(nombre);
        this.cargarDatosUsuario();
    },

    _renderizarChips() {
        const usuarios = StorageManager.obtenerUsuarios();
        UIManager.renderizarUsuarios(
            usuarios,
            (u) => this.seleccionarUsuarioDesdeChip(u),
            (u) => this.confirmarEliminarUsuario(u)
        );
        // Mostrar divisor "o" solo si hay chips
        const divisor = document.getElementById("login-divisor");
        if (divisor) divisor.style.display = usuarios.length > 0 ? "flex" : "none";
    },

    async cargarDatosUsuario() {

        await this.cargarCategorias();

        this.transacciones = StorageManager.obtenerTransacciones(this.usuario);
        this.presupuesto = StorageManager.obtenerPresupuesto(this.usuario);

        // Fondo personalizado
        const fondo = StorageManager.obtenerFondo(this.usuario);
        UIManager.aplicarFondo(fondo);

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

        // Fondo de pantalla
        const inputFondo = document.getElementById("input-fondo");
        document.getElementById("btn-cambiar-fondo").onclick = () => inputFondo.click();

        inputFondo.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target.result;
                    StorageManager.guardarFondo(this.usuario, base64);
                    UIManager.aplicarFondo(base64);
                    UIManager.notificar("¡Fondo actualizado!", "success");
                };
                reader.readAsDataURL(file);
            }
        };
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
                this._renderizarChips();
                this.mostrarVistaInicial();
            }
        );
    },

    cerrarSesion() {
        this.usuario = null;
        this.transacciones = [];
        this.presupuesto = 0;
        UIManager.mostrarLogin();
        this.mostrarVistaInicial();
    },

    actualizarUI() {
        const { balance, totalGastos, totalIngresos } = UIManager.actualizarStats(this.presupuesto, this.transacciones);
        UIManager.renderizarLista(this.transacciones, (id) => this.eliminarTransaccion(id));

        const pct = UIManager.actualizarProgreso(this.presupuesto, totalGastos, totalIngresos);

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
