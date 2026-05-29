const { validationResult } = require('express-validator');
const AWS = require('aws-sdk');
const db = require('../models/db');
const logger = require('../utils/logger');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE stock > 0';
    let params = [];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [products] = await db.query(query, params);
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM products WHERE stock > 0');

    res.json({ products, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    logger.error('Get products error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const [products] = await db.query(
      'SELECT * FROM products WHERE id = ?', [req.params.id]
    );
    if (!products[0]) return res.status(404).json({ error: 'Product not found' });
    res.json(products[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Create product (admin only)
exports.createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, price, stock } = req.body;
  let image_url = null;

  try {
    // Upload image to S3 if provided
    if (req.file) {
      const params = {
        Bucket: process.env.S3_BUCKET,
        Key: `products/${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      const s3Result = await s3.upload(params).promise();
      image_url = process.env.CLOUDFRONT_URL
        ? `${process.env.CLOUDFRONT_URL}/${params.Key}`
        : s3Result.Location;
    }

    const [result] = await db.query(
      'INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, stock, image_url]
    );

    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (err) {
    logger.error('Create product error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

// Update product (admin only)
exports.updateProduct = async (req, res) => {
  const { name, description, price, stock } = req.body;
  try {
    await db.query(
      'UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?',
      [name, description, price, stock, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
