import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate(`/post/${response.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Create New Post</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              minLength={3}
              maxLength={200}
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
            />
            <p className="text-sm text-gray-500 mt-1">
              {title.length}/200 characters
            </p>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content (Markdown Supported)
            </label>
            <textarea
              id="content"
              required
              minLength={10}
              className="input-field resize-none"
              rows="12"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content... Supports markdown formatting!"
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum 10 characters • Use markdown for formatting (# for headers, **bold**, *italic*, etc.)
            </p>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image (Optional)
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              className="input-field"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-md rounded-lg shadow-md"
                />
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Max size: 5MB • Supported: JPG, PNG, GIF, WEBP
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Publishing...' : 'Publish Post'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
