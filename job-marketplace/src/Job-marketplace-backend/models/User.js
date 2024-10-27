// user.js

const user = {
    biometricHash: '',
    walletAddress: '',
    faceImage: '', // Path to the uploaded image
    createdAt: new Date(), // Timestamp for creation
    updatedAt: new Date(), // Timestamp for updates
  };
  
  // Function to update the timestamp
  const updateTimestamps = () => {
    user.updatedAt = new Date();
  };
  
  module.exports = { user, updateTimestamps };
  