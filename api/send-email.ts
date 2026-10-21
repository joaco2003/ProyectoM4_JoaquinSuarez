import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // 1) Verificar quién llama: solo usuarios autenticados, y el destinatario es SU email.
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Falta el token' });

  let email: string | undefined;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    email = decoded.email;
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
  if (!email) return res.status(400).json({ error: 'El usuario no tiene email' });

  // 2) Validar el body
  const taskTitle = typeof req.body?.taskTitle === 'string' ? req.body.taskTitle.slice(0, 100) : '';
  if (!taskTitle) return res.status(400).json({ error: 'Falta taskTitle' });

  // 3) Enviar con SES
  try {
    await ses.send(
      new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL!,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: 'Nueva tarea creada', Charset: 'UTF-8' },
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: `<h2>Tarea creada</h2><p>Agregaste la tarea <strong>${escapeHtml(taskTitle)}</strong> a tu lista.</p>`,
            },
            Text: { Charset: 'UTF-8', Data: `Agregaste la tarea "${taskTitle}" a tu lista.` },
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
