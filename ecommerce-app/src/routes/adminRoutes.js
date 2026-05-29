const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

router.use(authenticate, adminOnly);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
