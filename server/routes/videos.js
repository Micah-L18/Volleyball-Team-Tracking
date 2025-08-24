const express = require('express');
const router = express.Router();

// TODO: Implement video routes
router.get('/', (req, res) => {
  res.json({ message: 'Videos route - Coming soon' });
});

module.exports = router;
