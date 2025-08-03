const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

// Like a post
router.post('/:postId', verifyToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        await db.query(
            'INSERT INTO likes (post_id, user_id) VALUES (?, ?)', 
            [postId, userId]
        );
        res.json({ success: true, message: 'Post liked' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, message: 'Already liked' });
        } else {
            console.error('Like Error:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
});

// Unlike a post
router.delete('/:postId', verifyToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        await db.query(
            'DELETE FROM likes WHERE post_id = ? AND user_id = ?', 
            [postId, userId]
        );
        res.json({ success: true, message: 'Post unliked' });
    } catch (err) {
        console.error('Unlike Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get like count & whether current user liked the post
router.get('/:postId', verifyToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        const [likeCountResult] = await db.query(
            'SELECT COUNT(*) AS likeCount FROM likes WHERE post_id = ?', 
            [postId]
        );

        const [userLikeResult] = await db.query(
            'SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?', 
            [postId, userId]
        );

        res.json({
            likeCount: likeCountResult[0].likeCount,
            likedByUser: userLikeResult.length > 0
        });
    } catch (err) {
        console.error('Fetch Like Info Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// (Optional) Get all post IDs liked by a user
router.get('/user/:userId', verifyToken, async (req, res) => {
    const { userId } = req.params;

    try {
        const [results] = await db.query(
            'SELECT post_id FROM likes WHERE user_id = ?', 
            [userId]
        );

        res.json({ likedPosts: results.map(r => r.post_id) });
    } catch (err) {
        console.error('Fetch User Likes Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
