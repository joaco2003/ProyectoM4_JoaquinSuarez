import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { AuthMode } from '../types';

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, login, register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isLogin = mode === 'login';
  if (user) return <Navigate to="/" replace />;

  async function run(action: () => Promise<void>) {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Completá tu email y contraseña.');
      return;
    }
    void run(() => (isLogin ? login(email, password) : register(name, email, password)));
  }

  return (
    <main className="auth">
      <h1>{isLogin ? 'Iniciá sesión' : 'Creá tu cuenta'}</h1>
      <form onSubmit={handleSubmit} noValidate>
        {!isLogin && (
          <label>
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn primary" disabled={busy}>
          {isLogin ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
      <button className="btn" disabled={busy} onClick={() => void run(loginWithGoogle)}>
        Continuar con Google
      </button>
      <p className="switch">
        {isLogin ? (
          <>¿Todavía no tenés cuenta? <Link to="/register">Registrate</Link></>
        ) : (
          <>¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></>
        )}
      </p>
    </main>
  );
}
