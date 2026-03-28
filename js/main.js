const App = {
    usuario: null,
    transacciones: [],
    presupuesto: 0,

    async iniciar() {
        const usuarios = StorageManager.obtenerUsuarios();
        UIManager.renderizarUsuarios(usuarios,
            (u) => this.seleccionarUsuarioDesdeChip(u),
            (u) => this.confirmarEliminarUsuario(u)
        );

        // Al escribir el nombre, detecto si es usuario nuevo o existente
        document.getElementById("input-login-usuario").addEventListener("input", () => this.actualizarFormLogin());
        document.getElementById("input-login-usuario").onkeydown = (e) => {
            if (e.key === "Enter") this.login();
        };
        document.getElementById("input-password").onkeydown = (e) => {
            if (e.key === "Enter") this.login();
        };
        document.getElementById("input-confirm-password").onkeydown = (e) => {
            if (e.key === "Enter") this.login();
        };

        // Forzar solo números en tiempo real
        ['input-password', 'input-confirm-password'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
            });
        });

        // Botón mostrar/ocultar contraseña
        document.getElementById("btn-toggle-pass").onclick = () => {
            const inp = document.getElementById("input-password");
            inp.type = inp.type === "password" ? "text" : "password";
        };
        document.getElementById("btn-toggle-confirm-pass").onclick = () => {
            const inp = document.getElementById("input-confirm-password");
            inp.type = inp.type === "password" ? "text" : "password";
        };

        document.getElementById("btn-ingresar").onclick = () => this.login();
    },

    // Detecta si el usuario existe y ajusta el formulario
    actualizarFormLogin() {
        const nombre = document.getElementById("input-login-usuario").value.trim();
        const usuarios = StorageManager.obtenerUsuarios();
        const existe = usuarios.includes(nombre);

        const grupoPass = document.getElementById("grupo-password");
        const grupoConfirm = document.getElementById("grupo-confirm-password");
        const hint = document.getElementById("login-hint");
        const labelPass = document.getElementById("label-password");
        const btnIngresar = document.getElementById("btn-ingresar");

        // Limpiar campos al cambiar de usuario
        document.getElementById("input-password").value = "";
        document.getElementById("input-confirm-password").value = "";

        if (nombre === "") {
            grupoPass.style.display = "none";
            grupoConfirm.style.display = "none";
            hint.style.display = "none";
            btnIngresar.textContent = "Ingresar →";
            return;
        }

        if (existe) {
            // Usuario existente → solo pedir contraseña
            grupoPass.style.display = "block";
            grupoConfirm.style.display = "none";
            labelPass.textContent = "Contraseña";
            hint.style.display = "block";
            hint.className = "login-hint hint-info";
            hint.textContent = "👤 Usuario existente. Ingresá tu contraseña.";
            btnIngresar.textContent = "Iniciar sesión →";
        } else {
            // Usuario nuevo → pedir contraseña y confirmación
            grupoPass.style.display = "block";
            grupoConfirm.style.display = "block";
            labelPass.textContent = "Crear contraseña";
            hint.style.display = "block";
            hint.className = "login-hint hint-new";
            hint.textContent = "✨ Usuario nuevo. Elegí una contraseña para tu cuenta.";
            btnIngresar.textContent = "Crear cuenta →";
        }
    },

    async login() {
        const nombre = document.getElementById("input-login-usuario").value.trim();
        const password = document.getElementById("input-password").value;
        const confirmPassword = document.getElementById("input-confirm-password").value;

        if (nombre === "") {
            UIManager.notificar("Ingresá tu nombre para continuar", "error");
            return;
        }

        const usuarios = StorageManager.obtenerUsuarios();
        const existe = usuarios.includes(nombre);

        if (existe) {
            // Login de usuario existente
            if (password === "") {
                UIManager.notificar("Ingresá tu contraseña", "error");
                document.getElementById("input-password").focus();
                return;
            }
            const ok = await StorageManager.verificarPassword(nombre, password);
            if (!ok) {
                UIManager.notificar("❌ Contraseña incorrecta", "error");
                document.getElementById("input-password").value = "";
                document.getElementById("input-password").focus();
                return;
            }
            this.seleccionarUsuario(nombre);
        } else {
            // Registro de usuario nuevo
            if (password === "") {
                UIManager.notificar("Elegí una contraseña para tu cuenta", "error");
                document.getElementById("input-password").focus();
                return;
            }
            if (password.length < 4) {
                UIManager.notificar("El PIN debe tener entre 4 y 6 dígitos numéricos", "error");
                return;
            }
            if (!/^[0-9]+$/.test(password)) {
                UIManager.notificar("Solo se permiten números en la contraseña", "error");
                return;
            }
            if (password !== confirmPassword) {
                UIManager.notificar("Las contraseñas no coinciden", "error");
                document.getElementById("input-confirm-password").value = "";
                document.getElementById("input-confirm-password").focus();
                return;
            }
            await StorageManager.guardarPassword(nombre, password);
            UIManager.notificar("✅ Cuenta creada exitosamente", "success");
            this.seleccionarUsuario(nombre);
        }
    },

    // Login desde chip (pide contraseña si tiene)
    async seleccionarUsuarioDesdeChip(nombre) {
        if (!StorageManager.tienePassword(nombre)) {
            // Usuario legacy sin contraseña → acceso directo
            this.seleccionarUsuario(nombre);
            return;
        }
        // Pre-cargar nombre y mostrar el formulario de contraseña
        document.getElementById("input-login-usuario").value = nombre;
        this.actualizarFormLogin();
        document.getElementById("input-password").focus();
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
                    (u) => this.seleccionarUsuarioDesdeChip(u),
                    (u) => this.confirmarEliminarUsuario(u)
                );
            }
        );
    },

    cerrarSesion() {
        this.usuario = null;
        this.transacciones = [];
        this.presupuesto = 0;
        // Resetear campos del formulario de login
        document.getElementById("input-login-usuario").value = "";
        document.getElementById("input-password").value = "";
        document.getElementById("input-confirm-password").value = "";
        document.getElementById("grupo-password").style.display = "none";
        document.getElementById("grupo-confirm-password").style.display = "none";
        document.getElementById("login-hint").style.display = "none";
        document.getElementById("btn-ingresar").textContent = "Ingresar →";
        const usuarios = StorageManager.obtenerUsuarios();
        UIManager.renderizarUsuarios(usuarios,
            (u) => this.seleccionarUsuarioDesdeChip(u),
            (u) => this.confirmarEliminarUsuario(u)
        );
        UIManager.mostrarLogin();
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
