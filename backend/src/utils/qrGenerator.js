const QRCodeLib = require('qrcode');

/**
 * Generates a base64 Data URL string representing a QR Code containing the encrypted token.
 */
const generateQRDataUrl = async (text) => {
  try {
    const dataUrl = await QRCodeLib.toDataURL(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      color: {
        dark: '#1e293b', // Sleek dark slate
        light: '#ffffff',
      },
      width: 400,
    });
    return dataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

module.exports = { generateQRDataUrl };
