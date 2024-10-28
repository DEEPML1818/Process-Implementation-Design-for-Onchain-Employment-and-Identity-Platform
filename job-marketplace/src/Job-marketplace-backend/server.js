const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Set up the absolute path for the uploads folder
const IMAGE_FOLDER = path.join(__dirname, 'uploads');
if (!fs.existsSync(IMAGE_FOLDER)) {
  fs.mkdirSync(IMAGE_FOLDER);
}

// CORS Middleware
app.use(cors({
  origin: '*', // Allow all origins, but you can restrict this for security.
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Setup multer for file uploads with an absolute path
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGE_FOLDER); // Set destination to the absolute path
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep the original filename
  }
});

const upload = multer({ storage: storage });

// Serve the /uploads folder for static file access
app.use('/uploads', express.static(IMAGE_FOLDER));

// POST route to upload face image and store user data
app.post('/upload', upload.single('faceImage'), async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const faceImage = req.file ? req.file.path : null;

    // Check if face image is uploaded
    if (!faceImage) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Request Body:', req.body); // Debugging line
    console.log('Uploaded File:', req.file); // Debugging line

    // Send the response with user data
    res.status(201).json({
      message: 'Face image registered successfully!',
      referenceImageUrl: `http://localhost:${port}/uploads/${req.file.filename}`
    });

  } catch (error) {
    console.error('Error registering user data:', error);
    // Respond with error details to identify issue
    res.status(500).json({ error: 'Error registering user data', details: error.message });
  }
});

// GET route for fetching all image URLs from the uploads folder
app.get('/images', (req, res) => {
  fs.readdir(IMAGE_FOLDER, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading directory');
    }

    const imageUrls = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
                           .map(file => `http://localhost:${port}/uploads/${file}`);

    res.json(imageUrls);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
