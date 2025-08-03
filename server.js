// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// const PORT = 3001;

// // Import modular routes
// const hadithRoutes = require('./routes/hadith');
// const mosqueRoutes = require('./routes/nearbyMosques');
// const geminiRoutes = require('./routes/gemini'); // 👈 NEW

// // Middlewares
// app.use(cors());
// app.use(express.json());

// // Use routes
// app.use('/api', hadithRoutes);
// app.use('/api', mosqueRoutes); // Will respond to /api/nearby-mosques
// app.use('/api', geminiRoutes); // 👈 NEW

// // Root endpoint
// app.get('/', (req, res) => {
//   res.send('🕌 Islamic API Server Running...');
// });

// app.listen(PORT, () => {
//   console.log(`✅ Server is running on http://localhost:${PORT}`);
// });

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db'); // MySQL connection
const authRoutes = require('./routes/auth'); // Auth routes

// Existing routes
const hadithRoutes = require('./routes/hadith');
const mosqueRoutes = require('./routes/nearbyMosques');
const geminiRoutes = require('./routes/gemini');
const postsRoutes = require('./routes/posts'); // 👈 NEW
const likesRoutes = require('./routes/likes');
const storiesRoutes = require('./routes/stories'); // ✅ NEW
const tasbihRoutes = require('./routes/tasbih');


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Routes
app.use('/api', authRoutes);         // ✅ User login/signup/profile
app.use('/api', hadithRoutes);       // ✅ /api/hadith
app.use('/api', mosqueRoutes);       // ✅ /api/nearby-mosques
app.use('/api', geminiRoutes);       // ✅ /api/gemini
app.use('/api/posts', postsRoutes); // 👈 NEW
app.use('/api/likes', likesRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/tasbih', tasbihRoutes);



// Root Test
app.get('/', (req, res) => {
  res.send('🕌 Islamic API Server Running...');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
