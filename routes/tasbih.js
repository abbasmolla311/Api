const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

// GET all goals for a user
router.get('/goals/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const [goals] = await db.query('SELECT * FROM tasbih_goals WHERE user_id = ?', [userId]);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST a new tasbih goal
router.post('/goals', verifyToken, async (req, res) => {
  try {
    const { user_id, text, target_count, current_count } = req.body;
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO tasbih_goals 
        (user_id, text, target_count, current_count, start_date, end_date, streak, last_updated) 
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [user_id, text, target_count, current_count ?? 0, now, endDate, now]
    );

    const [rows] = await db.query('SELECT * FROM tasbih_goals WHERE user_id = ? ORDER BY id DESC LIMIT 1', [user_id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add goal' });
  }
});

// PATCH to increment tasbih count (matches frontend)
router.patch('/goals/:goalId', verifyToken, async (req, res) => {
  try {
    const { goalId } = req.params;
    const { increment } = req.body;
    const now = new Date();

    if (typeof increment !== 'number') {
      return res.status(400).json({ error: 'Invalid increment value' });
    }

    await db.query(
      'UPDATE tasbih_goals SET current_count = current_count + ?, last_updated = ? WHERE id = ?',
      [increment, now, goalId]
    );

    const [rows] = await db.query('SELECT * FROM tasbih_goals WHERE id = ?', [goalId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update count' });
  }
});

// GET public friends progress
router.get('/friends/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const [friends] = await db.query(`
      SELECT u.name, g.text, g.current_count as progress, g.target_count as goal, g.streak
      FROM tasbih_friends f
      JOIN users u ON u.id = f.friend_user_id
      JOIN tasbih_goals g ON g.user_id = u.id
      WHERE f.user_id = ? AND f.is_public = 1
    `, [userId]);

    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends progress' });
  }
});

// PUT to update goal privacy (optional)
router.put('/privacy/:goalId', verifyToken, async (req, res) => {
  try {
    const { goalId } = req.params;
    const { isPublic } = req.body;

    await db.query('UPDATE tasbih_friends SET is_public = ? WHERE id = ?', [isPublic, goalId]);
    res.json({ message: 'Privacy setting updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update privacy' });
  }
});

module.exports = router;