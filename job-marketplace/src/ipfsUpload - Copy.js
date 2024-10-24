// ipfsUpload.js
import axios from 'axios';

export const uploadToIPFS = async (data) => {
  const formData = new FormData();
  formData.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const response = await axios.post(url, formData, {
    maxBodyLength: 'Infinity',
    headers: {
      'Content-Type': `multipart/form-data`,
      pinata_api_key: 'your-pinata-api-key',
      pinata_secret_api_key: 'your-pinata-secret-api-key',
    },
  });

  return response.data.IpfsHash;
};
