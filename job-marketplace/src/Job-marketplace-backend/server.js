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

// Ensure the uploads directory exists
const IMAGE_FOLDER = path.join(__dirname, 'uploads');
if (!fs.existsSync(IMAGE_FOLDER)) {
  fs.mkdirSync(IMAGE_FOLDER);
}

// CORS Middleware
app.use(cors({
  origin: '*', // Allow all origins, but you can restrict this for security.
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

// Validate file types (accept only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept image files
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

// Serve the /uploads folder for static file access
app.use('/uploads', express.static(IMAGE_FOLDER));

// GET route for fetching all image URLs from the uploads folder
app.get('/images', (req, res) => {
  fs.readdir(IMAGE_FOLDER, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading directory');
    }

    // Filter only image files and return URLs
    const imageUrls = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
                           .map(file => `http://localhost:${port}/uploads/${file}`); // Full URL to the images

    res.json(imageUrls);
  });
});

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
      referenceImageUrl: `http://localhost:${port}/uploads/${req.file.filename}` // Full URL to the uploaded image
    });
  } catch (error) {
    console.error('Error registering biometric data:', error);  // <-- Log the error here
    res.status(500).json({ error: 'Error registering biometric data', details: error.message });
  }
});

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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
