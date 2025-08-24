const express = require('express');
const router = express.Router();

// TODO: Implement statistics routes
router.get('/', (req, res) => {
  res.json({ message: 'Statistics route - Coming soon' });
});

module.exports = router;
