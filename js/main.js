
const App = {
    transacciones: [],
    presupuesto: 0,
    categoriasCargadas: [],

    // Inicializar la aplicación
    async iniciar() {
        console.log("Iniciando Billetera Virtual...");

        // Cargar datos asíncronos
        await this.cargarCategorias();

        // Cargar datos de Storage
        this.transacciones = StorageManager.obtenerTransacciones();
        this.presupuesto = StorageManager.obtenerPresupuesto();

        // Event Listeners
        this.configurarEventos();

        // Renderizar estado inicial
        this.actualizarUI();
    },

    // Cargar categorías desde JSON local
    async cargarCategorias() {
        try {
            const respuesta = await fetch("data/transacciones.json");
            if (!respuesta.ok) throw new Error("No se pudo cargar el archivo de datos");

            this.categoriasCargadas = await respuesta.json();
            console.log("Categorías cargadas:", this.categoriasCargadas);
        } catch (error) {
            console.error("Error al cargar categorías:", error);
            UIManager.notificar("Error al conectar con el servidor de datos", "error");
        } finally {
            console.log("Carga de datos finalizada.");
        }
    },

    configurarEventos() {
        // Formulario de gastos
        const form = document.getElementById("formulario-gastos");
        form.onsubmit = (e) => this.procesarNuevaTransaccion(e);

        // Guardar presupuesto (al hacer clic)
        const btnPresu = document.getElementById("btn-guardar-presupuesto");
        const inputPresu = document.getElementById("input-presupuesto");
        
        btnPresu.onclick = () => this.cambiarPresupuesto();
        
        // Guardar presupuesto (al presionar Enter)
        inputPresu.onkeyup = (e) => {
            if (e.key === "Enter") {
                this.cambiarPresupuesto();
            }
        };

        // Reiniciar todo
        const btnReset = document.getElementById("btn-reiniciar-todo");
        btnReset.onclick = () => this.reiniciarAplicacion();
    },

    // transacción
    procesarNuevaTransaccion(e) {
        e.preventDefault();

        const inputDesc = document.getElementById("input-descripcion");
        const inputMonto = document.getElementById("input-monto");
        const selectTipo = document.getElementById("select-tipo");

        // VALIDACIÓN
        const descripcion = inputDesc.value.trim();
        const monto = this.parsearMonto(inputMonto.value);

        if (descripcion === "") {
            UIManager.notificar("La descripción no puede estar vacía", "error");
            return;
        }

        if (isNaN(monto) || monto <= 0) {
            UIManager.notificar("Monto inválido. Ingresá solo números (ej: 1500).", "error");
            return;
        }

        // Crear objeto de transacción
        const nueva = {
            id: Date.now(),
            descripcion: descripcion,
            monto: monto,
            tipo: selectTipo.value
        };

        // Actualizar estado
        this.transacciones.push(nueva);
        StorageManager.guardarTransacciones(this.transacciones);

        // Limpiar form y notificar
        e.target.reset();
        UIManager.notificar("Movimiento registrado con éxito");

        this.actualizarUI();
    },

    // cambiar presupuesto
    cambiarPresupuesto() {
        const input = document.getElementById("input-presupuesto");
        const valor = this.parsearMonto(input.value);

        if (!isNaN(valor) && valor >= 0) {
            this.presupuesto = valor;
            StorageManager.guardarPresupuesto(this.presupuesto);
            input.value = "";
            UIManager.notificar("Presupuesto actualizado");
            this.actualizarUI();
        } else {
            UIManager.notificar("Ingresa un monto válido (ej: 5000)", "error");
        }
    },

    // Normalizar montos: acepta 1500 | 1500.50 | 1500,50
    parsearMonto(valor) {
        let raw = String(valor).trim();
        // Cambiar coma por punto
        raw = raw.replace(",", ".");

        // Si el usuario puso un punto como separador de miles (ej: 5.000)
        // lo detectamos si hay exactamente 3 dígitos después del punto
        if (/^\d+\.\d{3}$/.test(raw)) {
            raw = raw.replace(".", "");
        }

        return parseFloat(raw);
    },

    // eliminar una transacción
    eliminarTransaccion(id) {
        UIManager.confirmarAccion(
            "¿Estás seguro?",
            "Esta acción no se puede deshacer.",
            () => {
                this.transacciones = this.transacciones.filter(t => t.id !== id);
                StorageManager.guardarTransacciones(this.transacciones);
                UIManager.notificar("Elemento eliminado");
                this.actualizarUI();
            }
        );
    },

    // reiniciar
    reiniciarAplicacion() {
        UIManager.confirmarAccion(
            "¿Reiniciar todo?",
            "Se borrarán todos los movimientos y el presupuesto.",
            () => {
                this.transacciones = [];
                this.presupuesto = 0;
                StorageManager.limpiarTodo();
                UIManager.notificar("Datos borrados");
                this.actualizarUI();
            }
        );
    },

    actualizarUI() {
        // Calcular balance actual
        const totalMovimientos = this.transacciones.reduce((acc, t) => {
            return t.tipo === "ingreso" ? acc + t.monto : acc - t.monto;
        }, 0);

        const balanceTotal = this.presupuesto + totalMovimientos;

        // Actualizar Cabecera
        UIManager.actualizarCabecera(this.presupuesto, balanceTotal);

        // Actualizar Lista
        UIManager.renderizarLista(this.transacciones, (id) => this.eliminarTransaccion(id));
    }
};

// Arrancar 
document.addEventListener("DOMContentLoaded", () => {
    App.iniciar();
});
