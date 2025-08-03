const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');
const verifyToken = require('../middleware/verifyToken');

// ✅ Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashed]
    );

    const userId = result[0].insertId;
    const token = jwt.sign({ id: userId, username }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // ✅ Save token in DB
    await db.query('UPDATE users SET token = ? WHERE id = ?', [token, userId]);

    res.json({
      success: true,
      token,
      userId,
      user: { id: userId, username, email }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ✅ Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ✅ Save token to DB
    await db.query('UPDATE users SET token = ? WHERE id = ?', [token, user.id]);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Profile route (protected)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT id, username, email, avatar_url, bio, join_date, last_active FROM users WHERE id = ?',
      [req.user.id]
    );

    if (results.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json(results[0]);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ✅ Logout (optional)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    await db.query('UPDATE users SET token = NULL WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ✅ Forgot Password (optional)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const reset_token = crypto.randomBytes(20).toString('hex');

  db.query('UPDATE users SET reset_token = ? WHERE email = ?', [reset_token, email], (err, result) => {
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Email not found' });

    console.log(`Reset token for ${email}: ${reset_token}`);
    res.json({ message: 'Reset link created. Check your email.' });
  });
});

// ✅ Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  const hashed = await bcrypt.hash(new_password, 10);

  db.query(
    'UPDATE users SET password = ?, reset_token = NULL WHERE reset_token = ?',
    [hashed, token],
    (err, result) => {
      if (result.affectedRows === 0) return res.status(400).json({ error: 'Invalid token' });
      res.json({ message: 'Password updated successfully' });
    }
  );
});

module.exports = router;
