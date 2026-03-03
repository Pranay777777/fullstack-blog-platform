import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import PrivateRoute from '../components/PrivateRoute';

const Protected = () => <div>Protected Content</div>;
const Login = () => <div>Login Page</div>;

const renderWithRouter = (route = '/protected') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <Protected />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('PrivateRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should redirect to login when unauthenticated', async () => {
    renderWithRouter();
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });

  it('should render protected content when authenticated', async () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'user', username: 'tester' }));

    renderWithRouter();
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
  });
});
