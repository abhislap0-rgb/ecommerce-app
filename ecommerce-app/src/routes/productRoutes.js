const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const productController = require('../controllers/productController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Use memory storage for S3 uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);

// Admin only routes
router.post('/', authenticate, adminOnly, upload.single('image'), [
  body('name').trim().escape().notEmpty().withMessage('Name required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock required')
], productController.createProduct);

router.put('/:id', authenticate, adminOnly, [
  body('name').trim().escape().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 })
], productController.updateProduct);

router.delete('/:id', authenticate, adminOnly, productController.deleteProduct);

module.exports = router;
