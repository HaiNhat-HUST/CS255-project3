// utils/generateToken.js (Create this file if it doesn't exist)
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Or a shorter duration like '1h', '24h'
  });
};

module.exports = generateToken;