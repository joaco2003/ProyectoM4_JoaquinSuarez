import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => useAuthMock() }));

function renderRoute() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<p>Tareas privadas</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('redirige a /login si no hay usuario', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    renderRoute();
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('Tareas privadas')).not.toBeInTheDocument();
  });

  it('muestra el contenido si hay usuario', () => {
    useAuthMock.mockReturnValue({ user: { uid: 'u1' }, loading: false });
    renderRoute();
    expect(screen.getByText('Tareas privadas')).toBeInTheDocument();
  });

  it('muestra "Cargando" mientras se resuelve la sesión', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true });
    renderRoute();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
  });
});
