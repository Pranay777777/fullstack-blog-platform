import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EditPost from '../pages/EditPost';
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

const renderWithRouter = (component, route = '/edit-post/1') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/edit-post/:id" element={component} />
      </Routes>
    </MemoryRouter>
  );
};

describe('EditPost Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load and update a post', async () => {
    api.get.mockResolvedValue({ data: { data: { id: 1, title: 'Old', content: 'Old content' } } });
    api.put.mockResolvedValue({ data: { success: true } });

    renderWithRouter(<EditPost />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Old')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Old'), { target: { value: 'Updated' } });
    fireEvent.change(screen.getByDisplayValue('Old content'), { target: { value: 'Updated content' } });
    fireEvent.click(screen.getByRole('button', { name: /update post/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/posts/1', {
        title: 'Updated',
        content: 'Updated content'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/post/1');
    });
  });
});
