// biometricUtils.js
import Web3 from 'web3';
import BiometricStorageABI from '../abi/BiometricStorage.sol/BiometricStorage.json';

const BiometricStorageABI1 = BiometricStorageABI.abi
const web3 = new Web3(window.ethereum);
const contractAddress = '0xFA16A49a5520038B186733777506636e0AFdB8ab';
const biometricStorage = new web3.eth.Contract(BiometricStorageABI1, contractAddress);

// Register the biometric hash on-chain
export const registerUser = async (biometricHash) => {
  const accounts = await web3.eth.getAccounts();
  await biometricStorage.methods.registerUser(biometricHash).send({ from: accounts[0] });
};

// Verify the biometric hash on-chain
export const verifyUser = async (biometricHash) => {
  const accounts = await web3.eth.getAccounts();
  const isVerified = await biometricStorage.methods.verifyUser(biometricHash).call({ from: accounts[0] });
  return isVerified;
};
