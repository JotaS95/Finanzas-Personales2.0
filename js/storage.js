const StorageManager = {
    //LocalStorage
    KEYS: {
        TRANSACCIONES: "presuFinal_transacciones",
        PRESUPUESTO: "presuFinal_presupuesto"
    },

    // Guardar transacciones
    guardarTransacciones(lista) {
        localStorage.setItem(this.KEYS.TRANSACCIONES, JSON.stringify(lista));
    },

    // Obtener transacciones
    obtenerTransacciones() {
        const data = localStorage.getItem(this.KEYS.TRANSACCIONES);
        return data ? JSON.parse(data) : [];
    },

    // Guardar presupuesto
    guardarPresupuesto(valor) {
        const num = parseFloat(valor);
        localStorage.setItem(this.KEYS.PRESUPUESTO, isNaN(num) ? "0" : num.toString());
    },

    // Obtener presupuesto
    obtenerPresupuesto() {
        const data = localStorage.getItem(this.KEYS.PRESUPUESTO);
        const parsed = parseFloat(data);
        return isNaN(parsed) ? 0 : parsed;
    },

    // Limpiar todo
    limpiarTodo() {
        localStorage.removeItem(this.KEYS.TRANSACCIONES);
        localStorage.removeItem(this.KEYS.PRESUPUESTO);
    }
};
