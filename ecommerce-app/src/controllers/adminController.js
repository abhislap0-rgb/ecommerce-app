const db = require('../models/db');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get dashboard stats
exports.getStats = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as totalOrders FROM orders');
    const [[{ totalRevenue }]] = await db.query(
      "SELECT COALESCE(SUM(total), 0) as totalRevenue FROM orders WHERE status != 'pending'"
    );
    const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) as totalProducts FROM products');

    res.json({ totalUsers, totalOrders, totalRevenue, totalProducts });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ? AND role != "admin"', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
