const QRCode = require('qrcode');

/**
 * Generates a UPI payment QR code as a base64 PNG string.
 * @param {object} params
 * @param {string} params.upiId - UPI VPA (e.g. kothari@upi)
 * @param {string} params.displayName - Payee name
 * @param {number} params.amount - Amount in INR
 * @param {string} params.bookingRef - Transaction note / reference
 * @returns {Promise<string>} base64 encoded PNG data URL
 */
const generateUpiQR = async ({ upiId, displayName, amount, bookingRef }) => {
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(displayName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Kothari Foundation - ${bookingRef}`)}&tr=${encodeURIComponent(bookingRef)}`;

  const qrDataUrl = await QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });

  return qrDataUrl;
};

module.exports = { generateUpiQR };
