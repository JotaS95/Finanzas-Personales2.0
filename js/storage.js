/**
 * storage.js - Manejo persistente de datos (multi-usuario)
 */

const StorageManager = {
    USUARIOS_KEY: "billetera_usuarios_lista",

    getKeys(usuario) {
        return {
            TRANSACCIONES: `billetera_${usuario}_transacciones`,
            PRESUPUESTO: `billetera_${usuario}_presupuesto`,
        };
    },

    // Lista de usuarios
    obtenerUsuarios() {
        const data = localStorage.getItem(this.USUARIOS_KEY);
        return data ? JSON.parse(data) : [];
    },

    registrarUsuario(usuario) {
        const lista = this.obtenerUsuarios();
        if (!lista.includes(usuario)) {
            lista.push(usuario);
            localStorage.setItem(this.USUARIOS_KEY, JSON.stringify(lista));
        }
    },

    // Eliminar un usuario y todos sus datos
    eliminarUsuario(usuario) {
        const keys = this.getKeys(usuario);
        localStorage.removeItem(keys.TRANSACCIONES);
        localStorage.removeItem(keys.PRESUPUESTO);
        const lista = this.obtenerUsuarios().filter(u => u !== usuario);
        localStorage.setItem(this.USUARIOS_KEY, JSON.stringify(lista));
    },

    // Transacciones por usuario
    guardarTransacciones(usuario, lista) {
        localStorage.setItem(this.getKeys(usuario).TRANSACCIONES, JSON.stringify(lista));
    },

    obtenerTransacciones(usuario) {
        const data = localStorage.getItem(this.getKeys(usuario).TRANSACCIONES);
        return data ? JSON.parse(data) : [];
    },

    // Presupuesto por usuario
    guardarPresupuesto(usuario, valor) {
        localStorage.setItem(this.getKeys(usuario).PRESUPUESTO, valor.toString());
    },

    obtenerPresupuesto(usuario) {
        const data = localStorage.getItem(this.getKeys(usuario).PRESUPUESTO);
        return data ? parseFloat(data) : 0;
    },

    // Limpiar solo datos del usuario (no la cuenta)
    limpiarUsuario(usuario) {
        const keys = this.getKeys(usuario);
        localStorage.removeItem(keys.TRANSACCIONES);
        localStorage.removeItem(keys.PRESUPUESTO);
    }
};
