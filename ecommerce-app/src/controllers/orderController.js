const db = require('../models/db');
const logger = require('../utils/logger');

// Place order
exports.placeOrder = async (req, res) => {
  const { items } = req.body; // [{ product_id, quantity }]
  const userId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let total = 0;

    // Validate each product and calculate total
    for (const item of items) {
      const [products] = await conn.query(
        'SELECT * FROM products WHERE id = ? AND stock >= ?',
        [item.product_id, item.quantity]
      );
      if (!products[0]) {
        await conn.rollback();
        return res.status(400).json({
          error: `Product ${item.product_id} not available in requested quantity`
        });
      }
      total += products[0].price * item.quantity;
    }

    // Create order
    const [order] = await conn.query(
      'INSERT INTO orders (user_id, total) VALUES (?, ?)',
      [userId, total]
    );

    // Insert order items and reduce stock
    for (const item of items) {
      const [products] = await conn.query(
        'SELECT price FROM products WHERE id = ?', [item.product_id]
      );
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [order.insertId, item.product_id, item.quantity, products[0].price]
      );
      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Order placed successfully', orderId: order.insertId, total });
  } catch (err) {
    await conn.rollback();
    logger.error('Order error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, GROUP_CONCAT(p.name SEPARATOR ', ') as products
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email,
       GROUP_CONCAT(p.name SEPARATOR ', ') as products
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: update order status
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'paid', 'shipped'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
