const express = require('express');
const router = express.Router();

// TODO: Implement skill rating routes
router.get('/', (req, res) => {
  res.json({ message: 'Skill ratings route - Coming soon' });
});

module.exports = router;
