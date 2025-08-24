const express = require('express');
const router = express.Router();

// TODO: Implement development routes
router.get('/', (req, res) => {
  res.json({ message: 'Development route - Coming soon' });
});

module.exports = router;
