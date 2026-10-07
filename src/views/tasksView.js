const app = document.querySelector('#app')

export function mostrarTasksView(user, profile) {
  const nombreUsuario = profile?.name || user.email.split('@')[0]

  app.innerHTML = `
    <main class="tasks-page">

      <!-- ENCABEZADO Y PERFIL -->
      <header class="app-header">
        <div>
          <h1>Gestor de tareas</h1>
          <p>Bienvenido, <strong>${nombreUsuario}</strong> (${user.email})</p>
        </div>
        <button id="btnLogout" class="btn-secundario">Cerrar sesión</button>
      </header>

      <!-- SECCIÓN MI CUENTA (CAMBIO DE CONTRASEÑA) -->
      <section class="panel">
        <h2>Mi Cuenta</h2>
        <form id="formPassword">
          <div class="campo">
            <label for="nuevaPassword">Nueva contraseña</label>
            <input id="nuevaPassword" type="password" required minlength="6" placeholder="Escribe tu nueva contraseña">
          </div>
          <button type="submit" class="btn-secundario">Cambiar contraseña</button>
          <div id="msgPassword" class="mensaje-alerta hidden"></div>
        </form>
      </section>

      <!-- CREAR TAREA -->
      <section class="panel">
        <h2>Nueva tarea</h2>
        <form id="taskForm">
          <div class="campo">
            <label for="title">Título</label>
            <input id="title" type="text" required placeholder="Título de la tarea">
          </div>
          <div class="campo">
            <label for="description">Descripción</label>
            <input id="description" type="text" placeholder="Descripción de la tarea">
          </div>
          <div class="campo">
            <label for="priority">Prioridad</label>
            <select id="priority" required>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <button type="submit" class="btn-principal">Crear tarea</button>
        </form>
      </section>

      <!-- LISTA DE TAREAS -->
      <section class="panel">
        <h2>Mis Tareas y Compartidas</h2>
        <div id="lista-tareas">Cargando tareas...</div>
      </section>

      <!-- PANEL EDUCATIVO RLS -->
      <section class="panel rls-panel">
        <div class="rls-header">
          <div>
            <h2>Panel de prueba RLS por ID</h2>
            <p>Comprueba cómo Row Level Security protege los registros según tus permisos.</p>
          </div>
          <span class="rls-badge">PRUEBA EDUCATIVA</span>
        </div>

        <div class="campo">
          <label for="rlsTaskId">ID de la tarea</label>
          <input id="rlsTaskId" type="number" min="1" placeholder="Ejemplo: 5">
        </div>

        <div class="rls-buttons">
          <button id="btnBuscarRls" type="button" class="btn-estado">Buscar por ID</button>
          <button id="btnModificarRls" type="button" class="btn-estado">Modificar por ID</button>
          <button id="btnEliminarRls" type="button" class="btn-peligro">Eliminar por ID</button>
        </div>

        <div id="rlsModificarCampos" class="rls-modificar hidden">
          <div class="campo">
            <label for="rlsNuevoTitulo">Nuevo título</label>
            <input id="rlsNuevoTitulo" type="text" placeholder="Escribe el nuevo título">
          </div>
          <button id="btnConfirmarModificarRls" type="button" class="btn-estado">Confirmar modificación</button>
        </div>

        <div class="rls-result-container">
          <h3>Resultado</h3>
          <div id="rlsResultado" class="rls-result">
            Realiza una prueba utilizando el ID de una tarea.
          </div>
        </div>
      </section>

    </main>
  `
}

export function configurarTasksView({
  onCrear,
  onLogout,
  onCambiarPassword,
  onBuscarPorId,
  onModificarPorId,
  onEliminarPorId
}) {
  const formTask = document.querySelector('#taskForm')
  const formPassword = document.querySelector('#formPassword')
  const btnLogout = document.querySelector('#btnLogout')
  const btnBuscarRls = document.querySelector('#btnBuscarRls')
  const btnModificarRls = document.querySelector('#btnModificarRls')
  const btnEliminarRls = document.querySelector('#btnEliminarRls')
  const btnConfirmarModificarRls = document.querySelector('#btnConfirmarModificarRls')
  const camposModificar = document.querySelector('#rlsModificarCampos')

  // Crear tarea
  formTask.addEventListener('submit', event => {
    event.preventDefault()
    const title = document.querySelector('#title').value.trim()
    const description = document.querySelector('#description').value.trim()
    const priority = document.querySelector('#priority').value

    if (!title) return
    onCrear({ title, description, priority })
  })

  // Cambiar Contraseña
  formPassword.addEventListener('submit', event => {
    event.preventDefault()
    const nuevaPassword = document.querySelector('#nuevaPassword').value.trim()
    if (!nuevaPassword) return
    onCambiarPassword(nuevaPassword)
  })

  // Cerrar sesión
  btnLogout.addEventListener('click', () => onLogout())

  // RLS: Buscar por ID
  btnBuscarRls.addEventListener('click', () => {
    const id = obtenerIdRls()
    if (!id) return mostrarResultadoRls('Ingresa un ID válido.', 'error')
    onBuscarPorId(id)
  })

  // RLS: Mostrar campos modificación
  btnModificarRls.addEventListener('click', () => {
    const id = obtenerIdRls()
    if (!id) return mostrarResultadoRls('Ingresa un ID válido.', 'error')
    camposModificar.classList.remove('hidden')
  })

  // RLS: Confirmar Modificación
  btnConfirmarModificarRls.addEventListener('click', () => {
    const id = obtenerIdRls()
    const nuevoTitulo = document.querySelector('#rlsNuevoTitulo').value.trim()
    if (!id) return mostrarResultadoRls('Ingresa un ID válido.', 'error')
    if (!nuevoTitulo) return mostrarResultadoRls('Escribe el nuevo título.', 'error')
    onModificarPorId(id, nuevoTitulo)
  })

  // RLS: Eliminar por ID
  btnEliminarRls.addEventListener('click', () => {
    const id = obtenerIdRls()
    if (!id) return mostrarResultadoRls('Ingresa un ID válido.', 'error')
    onEliminarPorId(id)
  })
}

function obtenerIdRls() {
  const input = document.querySelector('#rlsTaskId')
  const id = Number(input.value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function mostrarResultadoRls(mensaje, tipo = 'normal') {
  const resultado = document.querySelector('#rlsResultado')
  if (resultado) {
    resultado.textContent = mensaje
    resultado.className = `rls-result ${tipo}`
  }
}

export function mostrarMensajePassword(mensaje, esError = false) {
  const msgBox = document.querySelector('#msgPassword')
  if (msgBox) {
    msgBox.textContent = mensaje
    msgBox.classList.remove('hidden')
    msgBox.style.color = esError ? '#red' : '#green'
  }
}

export function mostrarTareas({ tareas, currentUserId, otrosUsuarios, onCambiarEstado, onEliminar, onCompartir }) {
  const lista = document.querySelector('#lista-tareas')

  if (!tareas || tareas.length === 0) {
    lista.innerHTML = `<p class="mensaje">No tienes tareas registradas ni compartidas contigo.</p>`
    return
  }

  lista.innerHTML = tareas.map(tarea => {
    const esPropietario = tarea.user_id === currentUserId
    const etiquetaPropiedad = esPropietario ? 'Propia' : 'Compartida conmigo'

    // Opciones de usuarios para compartir
    const opcionesUsuarios = otrosUsuarios.map(u => `<option value="${u.id}">${u.name}</option>`).join('')

    return `
      <article class="tarea">
        <div>
          <h3>${tarea.title} <small>(${etiquetaPropiedad})</small></h3>
          <p>${tarea.description || 'Sin descripción'}</p>
          <div class="tarea-info">
            <span><strong>ID:</strong> ${tarea.id}</span>
            <span><strong>Prioridad:</strong> ${tarea.priority}</span>
            <span><strong>Estado:</strong> ${tarea.completed ? 'Completada' : 'Pendiente'}</span>
          </div>
        </div>

        <div class="acciones">
          <button class="btn-estado" data-action="estado" data-id="${tarea.id}" data-completed="${tarea.completed}">
            ${tarea.completed ? 'Marcar pendiente' : 'Completar'}
          </button>

          ${esPropietario ? `
            <button class="btn-eliminar" data-action="eliminar" data-id="${tarea.id}">Eliminar</button>
            <div class="compartir-box">
              <select id="share-select-${tarea.id}">
                <option value="">Compartir con...</option>
                ${opcionesUsuarios}
              </select>
              <button class="btn-secundario" data-action="compartir" data-id="${tarea.id}">Compartir</button>
            </div>
          ` : ''}
        </div>
      </article>
    `
  }).join('')

  // Eventos de cambiar estado
  document.querySelectorAll('[data-action="estado"]').forEach(btn => {
    btn.addEventListener('click', () => {
      onCambiarEstado({ id: Number(btn.dataset.id), estadoActual: btn.dataset.completed === 'true' })
    })
  })

  // Eventos de eliminar (solo propietario)
  document.querySelectorAll('[data-action="eliminar"]').forEach(btn => {
    btn.addEventListener('click', () => onEliminar(Number(btn.dataset.id)))
  })

  // Eventos de compartir (solo propietario)
  document.querySelectorAll('[data-action="compartir"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = Number(btn.dataset.id)
      const select = document.querySelector(`#share-select-${taskId}`)
      const targetUserId = select.value
      if (!targetUserId) return alert('Selecciona un usuario de la lista')
      onCompartir(taskId, targetUserId)
    })
  })
}

export function mostrarCargandoTareas() {
  const lista = document.querySelector('#lista-tareas')
  if (lista) lista.innerHTML = `<p class="mensaje">Cargando tareas...</p>`
}

export function limpiarFormularioTarea() {
  const form = document.querySelector('#taskForm')
  if (form) form.reset()
}