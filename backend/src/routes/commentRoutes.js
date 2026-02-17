const express = require('express');
const { body } = require('express-validator');
const {
  addComment,
  getCommentsByPost,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const commentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

// Routes
router.post('/:postId', protect, commentValidation, addComment);
router.get('/:postId', getCommentsByPost);
router.delete('/:id', protect, deleteComment);

module.exports = router;
