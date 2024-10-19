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

// POST route for uploading face image along with WebAuthn registration
app.post('/upload', upload.single('faceImage'), async (req, res) => {
  const { walletAddress, credential } = req.body;
  
  // Check if face image is uploaded
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Register WebAuthn credential
  try {
    const biometricHash = credential.id; // Using the credential ID from WebAuthn
    await registerWebAuthnCredential(biometricHash, walletAddress);  // Register the credential

    // Return the uploaded file URL along with the WebAuthn registration success
    res.json({ 
      message: 'Biometric data and face image registered successfully!', 
      referenceImageUrl: `/uploads/${req.file.filename}` 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error registering biometric data', details: error });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint to verify WebAuthn biometric credentials
app.post('/verify', async (req, res) => {
  const { assertion, walletAddress } = req.body;

  try {
    const verified = await verifyWebAuthnAssertion(assertion, walletAddress);
    res.status(200).json({ verified });
  } catch (error) {
    res.status(500).json({ error: 'Error verifying biometric data', details: error });
  }
});


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
