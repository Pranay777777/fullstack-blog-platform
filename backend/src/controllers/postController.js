const PostModel = require('../models/postModel');
const { AppError } = require('../utils/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { title, content } = req.body;
  const author_id = req.user.id;
  const image = req.file ? req.file.filename : null;

  const postId = PostModel.create({ title, content, author_id, image });

  const post = PostModel.findById(postId);

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: post
  });
});

// @desc    Get all posts with pagination
// @route   GET /api/posts
// @access  Public
const getAllPosts = asyncHandler(async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;

  // Validate pagination params
  if (page < 1 || limit < 1 || limit > 100) {
    return next(new AppError('Invalid pagination parameters', 400));
  }

  const result = PostModel.findAll({ page, limit });

  res.status(200).json({
    success: true,
    data: result.posts,
    pagination: result.pagination
  });
});

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const post = PostModel.findById(id);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (Author only)
const updatePost = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { id } = req.params;
  const { title, content } = req.body;
  const image = req.file ? req.file.filename : undefined;

  const post = PostModel.findById(id);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Check if user is the author
  if (post.author_id !== req.user.id) {
    return next(new AppError('Not authorized to update this post', 403));
  }

  const updated = PostModel.update(id, { title, content, image });

  if (!updated) {
    return next(new AppError('Failed to update post', 500));
  }

  const updatedPost = PostModel.findById(id);

  res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    data: updatedPost
  });
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Author only, or admin in later step)
const deletePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const post = PostModel.findById(id);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Check if user is the author or admin (admin check added in Step 5)
  if (post.author_id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this post', 403));
  }

  const deleted = PostModel.delete(id);

  if (!deleted) {
    return next(new AppError('Failed to delete post', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
});

// @desc    Get posts by logged in user
// @route   GET /api/posts/my-posts
// @access  Private
const getMyPosts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const posts = PostModel.findByAuthor(req.user.id, { page, limit });

  res.status(200).json({
    success: true,
    data: posts
  });
});

// @desc    Approve/reject post (Admin only)
// @route   PUT /api/posts/:id/approve
// @access  Private/Admin
const approvePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'pending', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }

  const post = PostModel.findById(id);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  const updated = PostModel.updateStatus(id, status);

  if (!updated) {
    return next(new AppError('Failed to update post status', 500));
  }

  res.status(200).json({
    success: true,
    message: `Post ${status} successfully`,
    data: PostModel.findById(id)
  });
});

// @desc    Get all posts including pending (Admin only)
// @route   GET /api/posts/admin/all
// @access  Private/Admin
const getAllPostsAdmin = asyncHandler(async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;

  const result = PostModel.findAllAdmin({ page, limit });

  res.status(200).json({
    success: true,
    data: result.posts,
    pagination: result.pagination
  });
});

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getMyPosts,
  approvePost,
  getAllPostsAdmin
};
