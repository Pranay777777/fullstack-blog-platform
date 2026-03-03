const CommentModel = require('../models/commentModel');
const PostModel = require('../models/postModel');
const { AppError } = require('../utils/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');

// @desc    Add a comment to a post
// @route   POST /api/comments
// @access  Private
const addComment = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { postId, content } = req.body;
  const user_id = req.user.id;

  // Check if post exists
  const post = PostModel.findById(postId);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Create comment
  const commentId = CommentModel.create({
    content,
    post_id: postId,
    user_id,
    status: 'pending'
  });

  const comment = CommentModel.findById(commentId);

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: comment
  });
});

// @desc    Get all comments for a post
// @route   GET /api/comments/:postId
// @access  Public
const getCommentsByPost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  // Check if post exists
  const post = PostModel.findById(postId);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  const includeUnapproved = req.user?.role === 'admin';
  const comments = CommentModel.findByPostId(postId, { includeUnapproved });

  res.status(200).json({
    success: true,
    count: comments.length,
    data: comments
  });
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (Author only or admin)
const deleteComment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const comment = CommentModel.findById(id);

  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  // Check if user is the comment author or admin
  if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this comment', 403));
  }

  const deleted = CommentModel.delete(id);

  if (!deleted) {
    return next(new AppError('Failed to delete comment', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

module.exports = {
  addComment,
  getCommentsByPost,
  deleteComment,
  approveComment: asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const comment = CommentModel.findById(id);
    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    const approved = CommentModel.approve(id);
    if (!approved) {
      return next(new AppError('Failed to approve comment', 500));
    }

    res.status(200).json({
      success: true,
      message: 'Comment approved'
    });
  })
};
