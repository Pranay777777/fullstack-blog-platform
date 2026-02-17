const LikeModel = require('../models/likeModel');
const { AppError } = require('../utils/errorHandler');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Toggle like on a post
// @route   POST /api/likes/post/:id
// @access  Private
const togglePostLike = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const result = LikeModel.togglePostLike(user_id, id);
  const likesCount = LikeModel.getPostLikes(id);

  res.status(200).json({
    success: true,
    message: result.liked ? 'Post liked' : 'Post unliked',
    data: {
      liked: result.liked,
      likesCount
    }
  });
});

// @desc    Toggle like on a comment
// @route   POST /api/likes/comment/:id
// @access  Private
const toggleCommentLike = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const result = LikeModel.toggleCommentLike(user_id, id);
  const likesCount = LikeModel.getCommentLikes(id);

  res.status(200).json({
    success: true,
    message: result.liked ? 'Comment liked' : 'Comment unliked',
    data: {
      liked: result.liked,
      likesCount
    }
  });
});

// @desc    Get post likes
// @route   GET /api/likes/post/:id
// @access  Public
const getPostLikes = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const likesCount = LikeModel.getPostLikes(id);
  
  let isLiked = false;
  if (req.user) {
    isLiked = LikeModel.isPostLikedByUser(req.user.id, id);
  }

  res.status(200).json({
    success: true,
    data: {
      likesCount,
      isLiked
    }
  });
});

module.exports = {
  togglePostLike,
  toggleCommentLike,
  getPostLikes
};
