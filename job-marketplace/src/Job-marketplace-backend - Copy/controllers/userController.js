const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');

// Set up AWS Rekognition
AWS.config.update({
  region: 'your-region',
  accessKeyId: 'your-access-key-id',
  secretAccessKey: 'your-secret-access-key'
});

const rekognition = new AWS.Rekognition();

// Multer setup for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Add user with facial recognition using AWS Rekognition
exports.addUser = async (req, res) => {
  const { passportDetails, visaDetails, employer, sector, phone, address, emergencyContact, homelandAddress } = req.body;
  const faceImage = req.file;

  try {
    // Prepare the image for AWS Rekognition
    const params = {
      Image: {
        Bytes: faceImage.buffer
      },
      Attributes: ['ALL']
    };

    // Send the image to AWS Rekognition
    rekognition.detectFaces(params, async (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Face recognition failed' });
      }

      // Get the face details and save them in the database
      const faceDetails = data.FaceDetails;

      const newUser = new User({
        passportDetails,
        visaDetails,
        employer,
        sector,
        phone,
        address,
        emergencyContact,
        homelandAddress,
        faceDetails
      });

      await newUser.save();
      res.status(201).json(newUser);
    });
  } catch (error) {
    res.status(400).json({ message: 'Error adding user', error: error.message });
  }
};
