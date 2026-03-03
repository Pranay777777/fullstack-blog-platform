import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreatePost from '../pages/CreatePost';
import api from '../api/axios';

vi.mock('../api/axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('CreatePost Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit a new post', async () => {
    api.post.mockResolvedValue({ data: { data: { id: 1 } } });

    renderWithRouter(<CreatePost />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Post' } });
    fireEvent.change(screen.getByLabelText(/content/i), { target: { value: 'This is post content.' } });
    fireEvent.click(screen.getByRole('button', { name: /publish post/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/posts', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      expect(mockNavigate).toHaveBeenCalledWith('/post/1');
    });
  });

  it('should show error on failure', async () => {
    api.post.mockRejectedValue({ response: { data: { error: 'Failed to create post' } } });

    renderWithRouter(<CreatePost />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Post' } });
    fireEvent.change(screen.getByLabelText(/content/i), { target: { value: 'This is post content.' } });
    fireEvent.click(screen.getByRole('button', { name: /publish post/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create post')).toBeInTheDocument();
    });
  });
});
