const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/posts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `post-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ✅ Create new post
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { caption, overlayType, isHalalVerified } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' });
    }

    const imageUrl = `/uploads/posts/${req.file.filename}`;
    const mediaType = req.file.mimetype; // image/jpeg or video/mp4
    const isVerified = isHalalVerified === 'true' || isHalalVerified === true;
    const cleanCaption = caption || '';

    const [result] = await db.query(
      `INSERT INTO posts 
      (user_id, content, image_url, overlay_type, is_halal_verified, verified_by, verification_timestamp, media_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        cleanCaption,
        imageUrl,
        overlayType || null,
        isVerified,
        isVerified ? 'system' : null,
        isVerified ? new Date() : null,
        mediaType
      ]
    );

    const [newPost] = await db.query(
      `SELECT p.*, u.username, u.avatar_url 
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newPost[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ✅ Get all posts (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [posts] = await db.query(
      `SELECT p.*, u.username, u.avatar_url 
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    const [post] = await db.query(
      `SELECT p.*, u.username, u.avatar_url 
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!post || post.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post[0]);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Delete a post
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [post] = await db.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);

    if (!post || post.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    // Delete media file
    if (post[0].image_url) {
      const imagePath = path.join(__dirname, '../', post[0].image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
