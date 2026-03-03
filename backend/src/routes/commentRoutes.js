const express = require('express');
const { body } = require('express-validator');
const {
  addComment,
  getCommentsByPost,
  deleteComment,
  approveComment
} = require('../controllers/commentController');
const { protect, optionalProtect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const commentValidation = [
  body('postId')
    .notEmpty()
    .withMessage('Post ID is required')
    .isInt({ min: 1 })
    .withMessage('Post ID must be a positive integer'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

// Routes
router.post('/', protect, commentValidation, addComment);
router.get('/:postId', optionalProtect, getCommentsByPost);
router.delete('/:id', protect, deleteComment);
router.put('/approve/:id', protect, authorize('admin'), approveComment);

module.exports = router;
