const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/stories');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/**
 * Create Story
 */
router.post('/', verifyToken, upload.single('media'), async (req, res) => {
  try {
    const { overlayType, type, title, content, arabic, translation } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    const mediaUrl = `${req.protocol}://${req.get('host')}/uploads/stories/${req.file.filename}`;

    const mediaType = req.file.mimetype;

    const [result] = await db.execute(
      `INSERT INTO stories 
        (user_id, media_url, media_type, overlay_type, type, title, content, arabic, translation) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, mediaUrl, mediaType, overlayType, type, title, content, arabic, translation]
    );

    const [story] = await db.query(
      `SELECT s.*, u.username, u.avatar_url 
       FROM stories s JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [result.insertId]
    );

    res.status(201).json(story[0]);
  } catch (error) {
    console.error('Story creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Get all active stories (not expired)
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [stories] = await db.query(
      `SELECT s.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) AS view_count,
        EXISTS(SELECT 1 FROM story_views WHERE story_id = s.id AND user_id = ?) AS viewed
       FROM stories s
       JOIN users u ON s.user_id = u.id
       WHERE s.expires_at IS NULL OR s.expires_at > NOW()
       ORDER BY s.created_at DESC`,
      [userId]
    );

    res.json(stories);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Get story by ID
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;

    const [story] = await db.query(
      `SELECT s.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) AS view_count,
        EXISTS(SELECT 1 FROM story_views WHERE story_id = s.id AND user_id = ?) AS viewed
       FROM stories s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [userId, storyId]
    );

    if (!story.length) {
      return res.status(404).json({ message: 'Story not found' });
    }

    res.json(story[0]);
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Record story view
 */
router.post('/:id/view', verifyToken, async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;

    const [story] = await db.query(
      `SELECT * FROM stories WHERE id = ? AND (expires_at IS NULL OR expires_at > NOW())`,
      [storyId]
    );

    if (!story.length) {
      return res.status(404).json({ message: 'Story not found or expired' });
    }

    const [existing] = await db.query(
      `SELECT * FROM story_views WHERE story_id = ? AND user_id = ?`,
      [storyId, userId]
    );

    if (existing.length === 0) {
      await db.execute(
        `INSERT INTO story_views (story_id, user_id) VALUES (?, ?)`,
        [storyId, userId]
      );
    }

    res.json({ message: 'View recorded' });
  } catch (error) {
    console.error('Story view error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Delete story
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;

    const [story] = await db.query(
      `SELECT * FROM stories WHERE id = ? AND user_id = ?`,
      [storyId, userId]
    );

    if (!story.length) {
      return res.status(404).json({ message: 'Story not found or unauthorized' });
    }

    await db.execute(`DELETE FROM stories WHERE id = ?`, [storyId]);

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Get stories by user ID
 */
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    const [stories] = await db.query(
      `SELECT s.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) AS view_count,
        EXISTS(SELECT 1 FROM story_views WHERE story_id = s.id AND user_id = ?) AS viewed
       FROM stories s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ? AND (s.expires_at IS NULL OR s.expires_at > NOW())
       ORDER BY s.created_at DESC`,
      [currentUserId, targetUserId]
    );

    res.json(stories);
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
