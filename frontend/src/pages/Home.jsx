import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts?page=${page}&limit=10`);
      setPosts(response.data.data);
      setPagination(response.data.pagination);
      setError('');
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-xl">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Latest Blog Posts</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {posts.length === 0 && !loading ? (
        <div className="card text-center">
          <p className="text-gray-600">No posts yet. Be the first to create one!</p>
          <Link to="/create-post" className="btn-primary mt-4 inline-block">
            Create Post
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="card hover:shadow-lg transition-shadow">
              {post.image && (
                <img
                  src={`http://localhost:5000/uploads/${post.image}`}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-t-lg mb-4 -mt-6 -mx-6"
                />
              )}
              <h2 className="text-2xl font-bold mb-2">
                <Link to={`/post/${post.id}`} className="text-blue-600 hover:text-blue-800">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-600 mb-4">
                {post.content.substring(0, 200)}
                {post.content.length > 200 && '...'}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>By {post.author_username}</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="py-2 px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
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

export default Home;
