import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ReactMarkdown from 'react-markdown';

const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
    fetchLikes();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data.data);
    } catch (err) {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/${id}`);
      setComments(response.data.data);
    } catch (err) {
      console.error('Failed to load comments');
    }
  };

  const fetchLikes = async () => {
    try {
      const response = await api.get(`/likes/post/${id}`);
      setLikes(response.data.data.likesCount);
      setIsLiked(response.data.data.isLiked);
    } catch (err) {
      console.error('Failed to load likes');
    }
  };

  const handleLike = async () => {
    if (!user) {
      setError('Please login to like posts');
      return;
    }

    try {
      const response = await api.post(`/likes/post/${id}`);
      setLikes(response.data.data.likesCount);
      setIsLiked(response.data.data.liked);
    } catch (err) {
      setError('Failed to like post');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post('/comments', { postId: id, content: newComment });
      setNewComment('');
      fetchComments();
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      setError('Please login to like comments');
      return;
    }

    try {
      await api.post(`/likes/comment/${commentId}`);
      fetchComments();
    } catch (err) {
      setError('Failed to like comment');
    }
  };

  const handleApproveComment = async (commentId) => {
    try {
      await api.put(`/comments/approve/${commentId}`);
      fetchComments();
    } catch (err) {
      setError('Failed to approve comment');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-xl">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">Post not found</h2>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const canDeletePost = user && (user.id === post.author_id || isAdmin());
  const canEditPost = user && user.id === post.author_id;

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}{post.image && (
          <div className="mb-6">
            <img
              src={`http://localhost:5000/uploads/${post.image}`}
              alt={post.title}
              className="w-full rounded-lg shadow-md max-h-96 object-cover"
            />
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
              isLiked
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={!user}
          >
            <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
            <span className="font-semibold">{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
          </button>
          {!user && (
            <p className="text-sm text-gray-500 mt-2">Login to like this post</p>
          )}
        </div>

        

      <div className="card mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-4xl font-bold">{post.title}</h1>
          {canDeletePost && (
            <div className="space-x-2">
              {canEditPost && (
                <Link to={`/edit-post/${post.id}`} className="btn-secondary">
                  Edit
                </Link>
              )}
              <button onClick={handleDeletePost} className="btn-danger">
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="text-gray-600 mb-4">
          <span>By {post.author_username}</span>
          <span className="mx-2">•</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>

        <div className="prose max-w-none text-gray-800">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-4">
          Comments ({comments.length})
        </h2>

        {user && (
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              className="input-field resize-none"
              rows="3"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary mt-2">
              Post Comment
            </button>
          </form>
        )}

        {!user && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
              Login
            </Link>{' '}
            to leave a comment
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {comment.user_username}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-gray-700 flex-1">{comment.content}</p>
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="text-red-500 hover:text-red-600 text-sm"
                      disabled={!user}
                    >
                      ❤️ {comment.like_count || 0}
                    </button>
                  </div>
                </div>
                {user && (user.id === comment.user_id || isAdmin()) && (
                  <div className="flex items-center gap-2">
                    {isAdmin() && comment.status !== 'approved' && (
                      <button
                        onClick={() => handleApproveComment(comment.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>

      <Link to="/" className="btn-secondary mt-8 inline-block">
        ← Back to Posts
      </Link>
    </div>
  );
};

export default PostDetails;
