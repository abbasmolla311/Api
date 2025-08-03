// routes/nearbyMosques.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
require('dotenv').config();

router.get('/nearby-mosques', async (req, res) => {
  const { lat, lng } = req.query;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and longitude are required." });
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=mosque&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google API Error:", data);
      return res.status(500).json({ error: data.error_message || data.status });
    }

    res.json(data);
  } catch (error) {
    console.error("Server Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch from Google Places API" });
  }
});

module.exports = router;
