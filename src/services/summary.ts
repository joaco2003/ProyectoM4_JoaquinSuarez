import type { User } from 'firebase/auth';

/**
 * Pide a la función serverless (/api/send-summary) que mande por email (AWS SES)
 * un resumen del estado de todas las tareas del usuario.
 * Las credenciales de AWS y Firebase Admin quedan solo en el servidor.
 * A diferencia del aviso de "tarea creada", acá SÍ lanzamos el error para mostrarlo en pantalla.
 */
export async function sendTasksSummaryEmail(user: User): Promise<void> {
    const token = await user.getIdToken();
    // Fecha local del usuario en formato YYYY-MM-DD (para marcar las tareas vencidas)
    const today = new Date().toLocaleDateString('en-CA');

    const res = await fetch('/api/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ today }),
    });

    if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'No se pudo enviar el resumen por email.');
    }
}