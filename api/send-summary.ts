import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const ses = new SESClient({ region: process.env.AWS_REGION ?? 'us-east-1' });

const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const PRIORITY_ORDER = { alta: 0, media: 1, baja: 2 } as const;
type Priority = keyof typeof PRIORITY_ORDER;

interface SummaryTask {
    title: string;
    description: string;
    completed: boolean;
    priority: Priority;
    dueDate: string | null; // YYYY-MM-DD
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TASKS = 200;

function byPriorityThenDue(a: SummaryTask, b: SummaryTask) {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.title.localeCompare(b.title);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    // 1) Verificar quién llama: solo usuarios autenticados, y el destinatario es SU email.
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Falta el token' });

    let uid: string;
    let email: string | undefined;
    try {
        const decoded = await getAuth().verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email;
    } catch {
        return res.status(401).json({ error: 'Token inválido' });
    }
    if (!email) return res.status(400).json({ error: 'El usuario no tiene email' });

    // 2) Fecha "de hoy" del usuario (para marcar vencidas). Si no es válida, usamos la del servidor.
    const bodyToday = req.body?.today;
    const today =
        typeof bodyToday === 'string' && DATE_RE.test(bodyToday)
            ? bodyToday
            : new Date().toISOString().slice(0, 10);

    // 3) Leer las tareas del usuario desde Firestore (el contenido no viene del cliente)
    let tasks: SummaryTask[];
    try {
        const snap = await getFirestore().collection('users').doc(uid).collection('tasks').limit(MAX_TASKS).get();
        tasks = snap.docs.map((d) => {
            const data = d.data();
            const priority: Priority = data.priority in PRIORITY_ORDER ? data.priority : 'media';
            return {
                title: String(data.title ?? '').slice(0, 200),
                description: String(data.description ?? '').slice(0, 300),
                completed: data.completed === true,
                priority,
                dueDate: typeof data.dueDate === 'string' && DATE_RE.test(data.dueDate) ? data.dueDate : null,
            };
        });
    } catch (error) {
        console.error('Firestore error', error);
        return res.status(500).json({ error: 'No se pudieron leer las tareas' });
    }

    if (tasks.length === 0) return res.status(400).json({ error: 'No tenés tareas para resumir' });

    const pending = tasks.filter((t) => !t.completed).sort(byPriorityThenDue);
    const completed = tasks.filter((t) => t.completed).sort(byPriorityThenDue);
    const overdue = pending.filter((t) => t.dueDate !== null && t.dueDate < today);

    // 4) Armar el contenido
    const meta = (t: SummaryTask) => {
        const parts = [`prioridad ${t.priority}`];
        if (t.dueDate) parts.push(`vence ${t.dueDate}`);
        return parts.join(' · ');
    };

    const htmlItem = (t: SummaryTask) => {
        const isOverdue = !t.completed && t.dueDate !== null && t.dueDate < today;
        return (
            `<li style="margin-bottom:10px"><strong>${escapeHtml(t.title)}</strong>` +
            ` <span style="color:#666">· ${escapeHtml(meta(t))}</span>` +
            (isOverdue ? ' <span style="color:#c4262e;font-weight:bold">· vencida</span>' : '') +
            (t.description ? `<br><span style="color:#555">${escapeHtml(t.description)}</span>` : '') +
            '</li>'
        );
    };

    const textItem = (t: SummaryTask) => {
        const isOverdue = !t.completed && t.dueDate !== null && t.dueDate < today;
        return `- ${t.title} (${meta(t)}${isOverdue ? ' · vencida' : ''})`;
    };

    const section = (title: string, list: SummaryTask[]) =>
        list.length
            ? `<h3 style="margin:20px 0 8px">${title} (${list.length})</h3><ul style="padding-left:20px;margin:0">${list.map(htmlItem).join('')}</ul>`
            : '';

    const html =
        `<div style="font-family:Arial,sans-serif;max-width:560px;color:#17172b">` +
        `<h2>Resumen de tus tareas</h2>` +
        `<p>Total: <strong>${tasks.length}</strong> · Pendientes: <strong>${pending.length}</strong> · ` +
        `Completadas: <strong>${completed.length}</strong>` +
        (overdue.length ? ` · <span style="color:#c4262e">Vencidas: <strong>${overdue.length}</strong></span>` : '') +
        `</p>` +
        section('Pendientes', pending) +
        section('Completadas', completed) +
        `</div>`;

    const text = [
        'Resumen de tus tareas',
        `Total: ${tasks.length} · Pendientes: ${pending.length} · Completadas: ${completed.length}` +
        (overdue.length ? ` · Vencidas: ${overdue.length}` : ''),
        '',
        pending.length ? `Pendientes (${pending.length}):\n${pending.map(textItem).join('\n')}\n` : '',
        completed.length ? `Completadas (${completed.length}):\n${completed.map(textItem).join('\n')}` : '',
    ]
        .filter(Boolean)
        .join('\n');

    // 5) Enviar con SES
    try {
        await ses.send(
            new SendEmailCommand({
                Source: process.env.SES_FROM_EMAIL!,
                Destination: { ToAddresses: [email] },
                Message: {
                    Subject: {
                        Data: `Resumen de tus tareas: ${pending.length} pendientes, ${completed.length} completadas`,
                        Charset: 'UTF-8',
                    },
                    Body: {
                        Html: { Charset: 'UTF-8', Data: html },
                        Text: { Charset: 'UTF-8', Data: text },
                    },
                },
            }),
        );
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('SES error', error);
        return res.status(500).json({ error: 'No se pudo enviar el email' });
    }
}