const express = require('express');
const {
  togglePostLike,
  toggleCommentLike,
  getPostLikes
} = require('../controllers/likeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Like routes
router.post('/post/:id', protect, togglePostLike);
router.post('/comment/:id', protect, toggleCommentLike);
router.get('/post/:id', getPostLikes);

module.exports = router;
