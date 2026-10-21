const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'El email no tiene un formato válido.',
  'auth/missing-password': 'Ingresá tu contraseña.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email. Probá iniciar sesión.',
  'auth/user-not-found': 'No encontramos una cuenta con ese email.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.',
  'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
  'auth/network-request-failed': 'Sin conexión. Revisá tu internet e intentá de nuevo.',
};

export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  return MESSAGES[code] ?? 'Ocurrió un error inesperado. Intentá de nuevo.';
}
