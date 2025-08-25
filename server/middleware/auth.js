const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE DEBUG ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  
  const authHeader = req.header('Authorization');
  console.log('Authorization header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'Missing');
  
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  console.log('Extracted token:', token ? `${token.substring(0, 20)}...` : 'No token extracted');

  if (!token) {
    console.log('❌ No token provided - returning 401');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified successfully');
    console.log('Decoded token contents:', JSON.stringify(decoded, null, 2));
    console.log('User ID from token:', decoded.id); // Changed from decoded.userId to decoded.id
    req.user = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    console.error('JWT Secret length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');
    console.error('Token length:', token ? token.length : 'undefined');
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
