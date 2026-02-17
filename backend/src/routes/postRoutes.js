const express = require('express');
const { body } = require('express-validator');
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getMyPosts,
  approvePost,
  getAllPostsAdmin
} = require('../controllers/postController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Validation rules
const postValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long')
];

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPostById);

// Protected routes
router.post('/', protect, upload.single('image'), postValidation, createPost);
router.put('/:id', protect, upload.single('image'), postValidation, updatePost);
router.delete('/:id', protect, deletePost);
router.get('/user/my-posts', protect, getMyPosts);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllPostsAdmin);
router.put('/:id/approve', protect, authorize('admin'), approvePost);

module.exports = router;
