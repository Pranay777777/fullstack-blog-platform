import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const AdminPanel = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/admin/all?page=${page}&limit=10`);
      setPosts(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId, status) => {
    try {
      await api.put(`/posts/${postId}/approve`, { status });
      fetchPosts();
    } catch (err) {
      setError('Failed to update post status');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/posts/${postId}`);
      fetchPosts();
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel - Manage Posts</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600">No posts found</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">
                      <Link to={`/post/${post.id}`} className="text-blue-600 hover:text-blue-800">
                        {post.title}
                      </Link>
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        post.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : post.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {post.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    By {post.author_username} • {new Date(post.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 line-clamp-2">
                    {post.content.substring(0, 150)}...
                  </p>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {post.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(post.id, 'approved')}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                  )}
                  {post.status !== 'rejected' && (
                    <button
                      onClick={() => handleApprove(post.id, 'rejected')}
                      className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                    >
                      Reject
                    </button>
                  )}
                  {post.status !== 'pending' && (
                    <button
                      onClick={() => handleApprove(post.id, 'pending')}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      Pending
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
