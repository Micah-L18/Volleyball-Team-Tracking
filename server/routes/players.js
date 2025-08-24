const express = require('express');
const router = express.Router();

// TODO: Implement player routes
router.get('/', (req, res) => {
  res.json({ message: 'Players route - Coming soon' });
});

module.exports = router;
