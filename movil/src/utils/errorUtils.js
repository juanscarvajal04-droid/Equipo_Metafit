// Mensajes de error de red reutilizables en las pantallas móviles.
export function mensajeErrorCarga(err) {
  if (!err?.response) return 'Sin conexión. Verificá tu red.';

  switch (err.response.status) {
    case 401:
      // El interceptor de axios ya cierra la sesión automáticamente.
      return null;
    case 403:
      return 'No tenés permiso para ver estos datos.';
    default:
      return err.response.status >= 500
        ? 'Error al cargar los datos. Intentá más tarde.'
        : 'No se pudieron cargar los datos.';
  }
}

export function mensajeErrorRegistroEjercicio(err, msg) {
  const status = err?.response?.status;
  if (status === 409) return 'Ya registraste este ejercicio hoy. Volvé mañana.';
  if (!err?.response) return 'Sin conexión. Verificá tu red.';
  if (status >= 500) return 'Error del servidor. Intentá más tarde.';
  return msg || 'No se pudo guardar. Intentá de nuevo.';
}
