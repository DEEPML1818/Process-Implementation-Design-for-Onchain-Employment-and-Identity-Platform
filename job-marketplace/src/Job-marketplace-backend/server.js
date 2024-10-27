const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');
const { registerWebAuthnCredential, verifyWebAuthnAssertion } = require('../utils/webAuthnUtils'); // WebAuthn helpers
const user = require('./models/User'); // Ensure this path is correct

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
  methods: ['GET', 'POST'], // Allow specific methods
  allowedHeaders: ['Content-Type'], // Allow specific headers
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

// Endpoint to get reference image URL or other data
app.post('/data', upload.single('faceImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ referenceImageUrl: `/uploads/${req.file.filename}` });
});

// GET route for fetching all image URLs from the uploads folder
app.get('/images', (req, res) => {
  fs.readdir(IMAGE_FOLDER, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading directory');
    }

    const imageUrls = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
                           .map(file => `http://localhost:${port}/uploads/${file}`); // Full URL to the images

    res.json(imageUrls);
  });
});

app.post('/upload', upload.single('faceImage'), async (req, res) => {
  try {
    const { walletAddress, credential } = req.body;
    const credentialId = req.body['credential.id']; // Accessing credential.id from the request body
    const faceImage = req.file ? req.file.path : null;

    console.log('Request Body:', req.body); // Debugging line
    console.log('Uploaded File:', req.file); // Debugging line

    // Check if face image is uploaded
    if (!faceImage) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

     // Update the user object
    user.walletAddress = walletAddress; // Or any other logic you want to implement
    updateTimestamps(); // Call to update timestamps

    // Register WebAuthn credential
    const biometricHash = credentialId; // Assuming credential.id holds biometric data
    await registerWebAuthnCredential(biometricHash, walletAddress);  // Register the credential

    // Save new user data
    const newUser = new user({
      Biodatas: {
        biometricHash,
        walletAddress,
        faceImage
      }
    });
    await newUser.save();

    // Log or process biometric data registration here
    console.log('Registering biometric data for user:', user);

    // Return a response
    res.json({ message: 'User data processed', user });

    // Send success response
    res.json({
      message: 'Biometric data and face image registered successfully!',
      referenceImageUrl: `http://localhost:${port}/uploads/${req.file.filename}`
    });

  } catch (error) {
    console.error('Error registering biometric data:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error registering biometric data', details: error.message });
    }
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
