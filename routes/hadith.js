const express = require('express');
const router = express.Router();

// Updated Hadith collections with proper PDF URLs
const hadithCollections = [
  {
    id: '1',
    title: 'Sahih Bukhari',
    author: 'Imam Muhammad al-Bukhari',
    description: 'The most authentic collection of Hadith.',
    totalHadith: 7563,
    pdfUrl: 'https://d1.islamhouse.com/data/en/ih_books/single/en_Sahih_Al-Bukhari.pdf',
  },
  {
    id: '2',
    title: 'Sahih Muslim',
    author: 'Imam Muslim ibn al-Hajjaj',
    description: 'Second most authentic collection of Hadith.',
    totalHadith: 5362,
    pdfUrl: 'https://www.islamicweblibrary.com/wp-content/uploads/2020/04/Sahih-Muslim-Full-PDF-4-Volumes.pdf',
  },
  {
    id: '3',
    title: 'Sunan Abu Dawood',
    author: 'Imam Abu Dawood',
    description: 'Collection focusing on legal hadith and matters of Islamic jurisprudence.',
    totalHadith: 4800,
    pdfUrl: 'https://www.islamicweblibrary.com/wp-content/uploads/2020/04/Sunan-Abi-Dawud-Full-PDF-5-Volumes.pdf',
  },
  {
    id: '4',
    title: 'Jami at-Tirmidhi',
    author: 'Imam at-Tirmidhi',
    description: 'Known for its commentary on the authenticity of hadith.',
    totalHadith: 3956,
    pdfUrl: 'https://www.islamicweblibrary.com/wp-content/uploads/2020/04/Jami-at-Tirmidhi-Full-PDF-6-Volumes.pdf',
  },
  {
    id: '5',
    title: 'Sunan an-Nasa\'i',
    author: 'Imam an-Nasa\'i',
    description: 'Collection with strict authentication criteria.',
    totalHadith: 5761,
    pdfUrl: 'https://www.islamicweblibrary.com/wp-content/uploads/2020/04/Sunan-an-Nasai-Full-PDF-6-Volumes.pdf',
  },
  {
    id: '6',
    title: 'Sunan Ibn Majah',
    author: 'Imam Ibn Majah',
    description: 'The sixth major collection of Hadith in Sunni Islam.',
    totalHadith: 4341,
    pdfUrl: 'https://www.islamicweblibrary.com/wp-content/uploads/2020/04/Sunan-Ibn-Majah-Full-PDF-5-Volumes.pdf',
  },
];

// Route: GET /api/hadith-collections
router.get('/hadith-collections', (req, res) => {
  res.json(hadithCollections);
});

module.exports = router;