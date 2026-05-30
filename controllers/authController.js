const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register new user
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  // Hash the password — NEVER store plain text
  const hashedPassword = await bcrypt.hash(password, 12);
  // Save to database (use parameterized query — prevents SQL injection)
  await db.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, hashedPassword]
  );
  res.json({ message: 'User registered successfully' });
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const [user] = await db.query(
    'SELECT * FROM users WHERE email = ?', [email]
  );
  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Create JWT token (expires in 1 day)
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  res.json({ token });
};
