const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// CORS Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST'], // Allow specific methods
  allowedHeaders: ['Content-Type'], // Allow specific headers
}));

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Destination folder
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep the original filename
  }
});

const upload = multer({ storage: storage });

// POST route for face image upload
const IMAGE_FOLDER = path.join(__dirname, './uploads'); // Your image folder path

app.get('/images', (req, res) => {
  fs.readdir(IMAGE_FOLDER, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading directory');
    }
    // Filter out non-image files if needed
    const imageUrls = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
                           .map(file => `/images/${file}`);
    res.json(imageUrls);
  });
});

// Endpoint for face image upload (optional if you want a separate endpoint)
app.post('/upload', upload.single('faceImage'), (req, res) => {
  res.json({ message: 'Image uploaded successfully!' });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Endpoint to get reference image URL or other data
app.post('/data', upload.single('faceImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ referenceImageUrl: `/uploads/${req.file.filename}` });
});
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
