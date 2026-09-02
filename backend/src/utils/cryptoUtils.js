const crypto = require('crypto');
const config = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
// Ensure key is exactly 32 bytes
const getKey = () => crypto.createHash('sha256').update(config.qrSecret).digest();

/**
 * Encrypts a JSON payload object into a secure cipher text string.
 * Format: ivHex:authTagHex:encryptedDataHex
 */
const encryptPayload = (payload) => {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  const text = JSON.stringify(payload);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts an encrypted QR payload token back into the payload object.
 */
const decryptPayload = (token) => {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid payload token structure');
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (err) {
    throw new Error(`Token decryption failed: ${err.message}`);
  }
};

/**
 * Generate rotatable random hex token
 */
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  encryptPayload,
  decryptPayload,
  generateRandomToken,
};
