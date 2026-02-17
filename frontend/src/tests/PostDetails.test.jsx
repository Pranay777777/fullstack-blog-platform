import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import PostDetails from '../pages/PostDetails';
import api from '../api/axios';

vi.mock('../api/axios');

const renderWithRouter = (component, { route = '/post/1', user = null } = {}) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'test-token');
  } else {
    localStorage.clear();
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path="/post/:id" element={component} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('PostDetails Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render markdown content', async () => {
    const mockPost = {
      id: 1,
      title: 'Test Post',
      content: '# Heading\n\nThis is **bold** text.',
      author_id: 1,
      author_username: 'testuser',
      created_at: new Date().toISOString()
    };

    api.get.mockImplementation((url) => {
      if (url.includes('/posts/')) {
        return Promise.resolve({ data: { data: mockPost } });
      }
      if (url.includes('/comments/')) {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url.includes('/likes/post/')) {
        return Promise.resolve({ data: { data: { likesCount: 0, isLiked: false } } });
      }
    });

    renderWithRouter(<PostDetails />, { route: '/post/1' });

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
    });

    // Check markdown rendering
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('should display post title and author', async () => {
    const mockPost = {
      id: 1,
      title: 'My Blog Post',
      content: 'Content here',
      author_id: 1,
      author_username: 'johndoe',
      created_at: new Date().toISOString()
    };

    api.get.mockImplementation((url) => {
      if (url.includes('/posts/')) {
        return Promise.resolve({ data: { data: mockPost } });
      }
      if (url.includes('/comments/')) {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url.includes('/likes/post/')) {
        return Promise.resolve({ data: { data: { likesCount: 5, isLiked: false } } });
      }
    });

    renderWithRouter(<PostDetails />, { route: '/post/1' });

    await waitFor(() => {
      expect(screen.getByText('My Blog Post')).toBeInTheDocument();
    });

    expect(screen.getByText(/By johndoe/)).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<PostDetails />, { route: '/post/1' });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
