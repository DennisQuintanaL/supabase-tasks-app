import {
  registrarUsuario,
  iniciarSesion,
  cerrarSesion,
  obtenerUsuarioActual,
  obtenerPerfil,
  cambiarPassword,
  obtenerOtrosUsuarios
} from './services/authService.js'

import {
  obtenerTareas,
  crearTarea,
  cambiarEstado,
  eliminarTarea,
  compartirTarea,
  buscarTareaPorId,
  modificarTareaPorId,
  eliminarTareaPorId,
  suscribirseATareas,
  cancelarSuscripcion
} from './services/taskService.js'

import {
  mostrarLoginView,
  configurarLoginView,
  mostrarMensajeLogin
} from './views/loginView.js'

import {
  mostrarTasksView,
  configurarTasksView,
  mostrarTareas,
  mostrarCargandoTareas,
  limpiarFormularioTarea,
  mostrarResultadoRls,
  mostrarMensajePassword
} from './views/tasksView.js'

import { mostrarConfirmacion } from './components/confirmModal.js'

let usuarioActual = null
let perfilUsuario = null
let otrosUsuarios = []
let canalRealtime = null

export async function iniciarApp() {
  const { user, error } = await obtenerUsuarioActual()

  if (error || !user) {
    mostrarPantallaLogin()
    return
  }

  await mostrarPantallaTareas(user)
}

function mostrarPantallaLogin(mensaje = '') {
  usuarioActual = null
  mostrarLoginView({ mensaje })
  configurarLoginView({
    onLogin: manejarLogin,
    onRegistro: manejarRegistro
  })
}

async function mostrarPantallaTareas(user) {
  usuarioActual = user
  perfilUsuario = await obtenerPerfil(user.id)
  otrosUsuarios = await obtenerOtrosUsuarios(user.id)

  mostrarTasksView(user, perfilUsuario)

  configurarTasksView({
    onCrear: manejarCrearTarea,
    onLogout: manejarLogout,
    onCambiarPassword: manejarCambiarPassword,
    onBuscarPorId: manejarBuscarTareaPorId,
    onModificarPorId: manejarModificarTareaPorId,
    onEliminarPorId: solicitarEliminarTareaPorId
  })

  await cargarTareas()
  await activarRealtime()
}

// ==========================================
// AUTENTICACIÓN Y PERFIL
// ==========================================

async function manejarLogin({ email, password }) {
  if (!email || !password) return mostrarMensajeLogin('Ingresa correo y contraseña.')
  const { data, error } = await iniciarSesion(email, password)
  if (error) return mostrarMensajeLogin('Error: ' + error.message)
  if (data.user) await mostrarPantallaTareas(data.user)
}

async function manejarRegistro({ email, password }) {
  if (!email || !password) return mostrarMensajeLogin('Ingresa correo y contraseña.')
  const { data, error } = await registrarUsuario(email, password)
  if (error) return mostrarMensajeLogin('Error: ' + error.message)

  if (data.session && data.user) {
    await mostrarPantallaTareas(data.user)
    return
  }
  mostrarMensajeLogin('Usuario registrado. Revisa tu correo si requiere confirmación.')
}

async function manejarLogout() {
  await detenerRealtime()
  await cerrarSesion()
  mostrarPantallaLogin('Sesión cerrada correctamente.')
}

async function manejarCambiarPassword(nuevaPassword) {
  const { error } = await cambiarPassword(nuevaPassword)
  if (error) {
    mostrarMensajePassword('Error: ' + error.message, true)
  } else {
    mostrarMensajePassword('Contraseña actualizada correctamente.')
  }
}

// ==========================================
// CRUD TAREAS Y COMPARTICIÓN
// ==========================================

async function cargarTareas() {
  mostrarCargandoTareas()
  const { data, error } = await obtenerTareas()

  if (error) {
    console.error('Error al obtener tareas:', error)
    return
  }

  mostrarTareas({
    tareas: data,
    currentUserId: usuarioActual.id,
    otrosUsuarios,
    onCambiarEstado: manejarCambioEstado,
    onEliminar: solicitarEliminarTarea,
    onCompartir: manejarCompartirTarea
  })
}

async function manejarCrearTarea({ title, description, priority }) {
  if (!usuarioActual) return
  const { error } = await crearTarea({ title, description, priority, userId: usuarioActual.id })
  if (error) return console.error('Error al crear tarea:', error)
  limpiarFormularioTarea()
}

async function manejarCambioEstado({ id, estadoActual }) {
  if (!usuarioActual) return
  const { error } = await cambiarEstado(id, estadoActual)
  if (error) console.error('Error al cambiar estado:', error)
}

function solicitarEliminarTarea(id) {
  mostrarConfirmacion({
    titulo: 'Eliminar tarea',
    mensaje: '¿Seguro que deseas eliminar esta tarea?',
    textoConfirmar: 'Eliminar',
    onConfirmar: async () => {
      const { error } = await eliminarTarea(id)
      if (error) console.error('Error al eliminar tarea:', error)
    }
  })
}

async function manejarCompartirTarea(taskId, targetUserId) {
  const { error } = await compartirTarea(taskId, targetUserId)
  if (error) {
    alert('Error al compartir tarea: ' + error.message)
  } else {
    alert('Tarea compartida con éxito')
  }
}

// ==========================================
// PRUEBAS EDUCATIVAS DE RLS POR ID
// ==========================================

async function manejarBuscarTareaPorId(id) {
  mostrarResultadoRls(`Buscando tarea con ID ${id}...`)
  const { data, error } = await buscarTareaPorId(id)

  if (error) return mostrarResultadoRls('Error: ' + error.message, 'error')
  if (!data || data.length === 0) {
    return mostrarResultadoRls(`No se encontró la tarea ${id} o RLS bloqueó la consulta.`, 'blocked')
  }

  const tarea = data[0]
  mostrarResultadoRls(`Acceso permitido por RLS. ID: ${tarea.id} | Título: ${tarea.title} | Prioridad: ${tarea.priority}`, 'success')
}

async function manejarModificarTareaPorId(id, nuevoTitulo) {
  mostrarResultadoRls(`Intentando modificar la tarea ${id}...`)
  const { data, error } = await modificarTareaPorId(id, nuevoTitulo)

  if (error) return mostrarResultadoRls('Error: ' + error.message, 'error')
  if (!data || data.length === 0) {
    return mostrarResultadoRls(`La tarea ${id} no existe o RLS impidió modificarla.`, 'blocked')
  }

  mostrarResultadoRls(`Tarea ${id} modificada correctamente por RLS.`, 'success')
}

function solicitarEliminarTareaPorId(id) {
  mostrarConfirmacion({
    titulo: 'Prueba de eliminación RLS',
    mensaje: `Se intentará eliminar directamente la tarea con ID ${id}.`,
    textoConfirmar: 'Intentar eliminar',
    onConfirmar: async () => {
      mostrarResultadoRls(`Intentando eliminar la tarea ${id}...`)
      const { data, error } = await eliminarTareaPorId(id)

      if (error) return mostrarResultadoRls('Error: ' + error.message, 'error')
      if (!data || data.length === 0) {
        return mostrarResultadoRls(`La tarea ${id} no existe o RLS impidió eliminarla.`, 'blocked')
      }

      mostrarResultadoRls(`Tarea ${id} eliminada correctamente.`, 'success')
    }
  })
}

// ==========================================
// REALTIME
// ==========================================

async function activarRealtime() {
  await detenerRealtime()
  canalRealtime = suscribirseATareas(async () => {
    await cargarTareas()
  })
}

async function detenerRealtime() {
  if (!canalRealtime) return
  await cancelarSuscripcion(canalRealtime)
  canalRealtime = null
}
