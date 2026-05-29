const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// User routes
router.post('/', authenticate, orderController.placeOrder);
router.get('/my-orders', authenticate, orderController.getUserOrders);

// Admin routes
router.get('/all', authenticate, adminOnly, orderController.getAllOrders);
router.put('/:id/status', authenticate, adminOnly, orderController.updateOrderStatus);

module.exports = router;
