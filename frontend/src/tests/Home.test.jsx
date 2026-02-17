import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import api from '../api/axios';
import Home from '../pages/Home';

vi.mock('../api/axios');

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render home page', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      }
    });

    renderWithRouter(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Latest Blog Posts')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    api.get.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<Home />);
    expect(screen.getByText('Loading posts...')).toBeInTheDocument();
  });

  it('should display posts when loaded', async () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Test Post 1',
        content: 'Test content 1',
        author_username: 'testuser',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Test Post 2',
        content: 'Test content 2',
        author_username: 'testuser2',
        created_at: new Date().toISOString()
      }
    ];

    api.get.mockResolvedValue({
      data: {
        data: mockPosts,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
      }
    });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    api.get.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load posts')).toBeInTheDocument();
    });
  });

  it('should display message when no posts exist', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      }
    });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/No posts yet/i)).toBeInTheDocument();
    });
  });

  it('should display pagination controls when multiple pages exist', async () => {
    const mockPosts = [{
      id: 1,
      title: 'Test Post',
      content: 'Test content',
      author_username: 'testuser',
      created_at: new Date().toISOString()
    }];

    api.get.mockResolvedValue({
      data: {
        data: mockPosts,
        pagination: { page: 1, limit: 10, total: 25, totalPages: 3 }
      }
    });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });
});
