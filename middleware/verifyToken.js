const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access Denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err.message); // Debugging
      return res.status(403).json({ error: 'Invalid token' });
    }

    console.log('✅ Verified JWT payload:', user); // Should contain user.id
    req.user = user;
    next();
  });
};

module.exports = verifyToken;
