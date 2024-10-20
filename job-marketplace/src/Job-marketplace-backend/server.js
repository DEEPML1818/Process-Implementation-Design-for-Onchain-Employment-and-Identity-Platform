const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');
const { registerWebAuthnCredential, verifyWebAuthnAssertion } = require('../utils/webAuthnUtils'); // WebAuthn helpers

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// CORS Middleware (Update 'your-frontend-url.com' to your frontend's actual domain)
app.use(cors({
  origin: '*', // Allow all origins for now, replace '*' with 'https://your-frontend-url.com' in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Multer setup for file uploads with validation (restrict to image uploads and 5MB limit)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Destination folder
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep the original filename
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image uploads are allowed!'));
    }
  }
});

// POST route for face image upload
const IMAGE_FOLDER = path.join(__dirname, './uploads');

// GET route to retrieve images
app.get('/images', (req, res) => {
  fs.readdir(IMAGE_FOLDER, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Error reading directory');
    }
    const imageUrls = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
                           .map(file => `/uploads/${file}`);
    res.json(imageUrls);
  });
});

// POST route for uploading face image and WebAuthn registration
app.post('/upload', upload.single('faceImage'), async (req, res) => {
  const { walletAddress, credential } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const biometricHash = credential.id; // Using the credential ID from WebAuthn
    await registerWebAuthnCredential(biometricHash, walletAddress);  // Register the credential

    res.json({ 
      message: 'Biometric data and face image registered successfully!', 
      referenceImageUrl: `/uploads/${req.file.filename}` 
    });
  } catch (error) {
    console.error('Error registering biometric data:', error);
    res.status(500).json({ error: 'Error registering biometric data', details: error.message });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint to verify WebAuthn biometric credentials
app.post('/verify', async (req, res) => {
  const { assertion, walletAddress } = req.body;

  try {
    const verified = await verifyWebAuthnAssertion(assertion, walletAddress);
    res.status(200).json({ verified });
  } catch (error) {
    console.error('Error verifying biometric data:', error);
    res.status(500).json({ error: 'Error verifying biometric data', details: error.message });
  }
});

// POST route to handle file upload and return the reference image URL
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
