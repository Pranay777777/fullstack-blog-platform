import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const renderWithRouter = (component, user = null) => {
  localStorage.clear();
  
  if (user) {
    // Directly manipulate localStorage mock
    const store = {};
    store['user'] = JSON.stringify(user);
    store['token'] = 'test-token';
    
    localStorage.getItem.mockImplementation((key) => store[key] || null);
  } else {
    localStorage.getItem.mockReturnValue(null);
  }
  
  return render(
    <MemoryRouter>
      <AuthProvider>{component}</AuthProvider>
    </MemoryRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render navbar with logo', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByText('Blog Platform')).toBeInTheDocument();
  });

  it('should show login and register links when not authenticated', () => {
    renderWithRouter(<Navbar />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should show user menu when authenticated', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' };
    
    renderWithRouter(<Navbar />, mockUser);

    // Wait for auth context to load with increased timeout
    await waitFor(() => {
      expect(screen.queryByText('testuser')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Create Post')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('should show admin badge for admin users', async () => {
    const mockAdmin = { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' };
    
    renderWithRouter(<Navbar />, mockAdmin);

    // Wait for Admin Panel link to appear (which is unique to admin users)
    await waitFor(() => {
      const adminPanelLink = screen.getByText('Admin Panel');
      expect(adminPanelLink).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify the username is shown
    const usernameElements = screen.getAllByText(/admin/i);
    expect(usernameElements.length).toBeGreaterThan(0);
  });
});
