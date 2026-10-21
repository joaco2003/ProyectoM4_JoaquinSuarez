import type { User } from 'firebase/auth';

/**
 * Pide a la función serverless (/api/send-email) que mande un email vía AWS SES.
 * SES no se llama desde el navegador: las credenciales de AWS quedan solo en el servidor.
 * Es "best effort": si falla, no bloquea la creación de la tarea.
 */
export async function sendTaskCreatedEmail(user: User, taskTitle: string): Promise<void> {
  try {
    const token = await user.getIdToken();
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ taskTitle }),
    });
  } catch (error) {
    console.warn('No se pudo enviar la notificación por email', error);
  }
}
