import { supabase } from '../config/supabase.js'

// Registro de usuario
export async function registrarUsuario(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  return { data, error }
}

// Inicio de sesión
export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

// Cierre de sesión
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Obtener sesión activa
export async function obtenerUsuarioActual() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Obtener perfil del usuario desde la tabla profiles
export async function obtenerPerfil(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle() // Evita el error PGRST116 si la fila no existe

  if (error) console.error('Error al obtener perfil:', error)
  return data
}

// Cambiar contraseña del usuario autenticado
export async function cambiarPassword(nuevaPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: nuevaPassword
  })
  return { data, error }
}

// Obtener lista de otros usuarios registrados para compartir tareas
export async function obtenerOtrosUsuarios(currentUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .neq('id', currentUserId)

  if (error) console.error('Error al obtener otros usuarios:', error)
  return data || []
}