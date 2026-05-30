const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Strict rate limit for login - prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.register);

// Login
router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

// Get profile (protected)
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
