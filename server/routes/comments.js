const express = require('express');
const router = express.Router();

// TODO: Implement comment routes
router.get('/', (req, res) => {
  res.json({ message: 'Comments route - Coming soon' });
});

module.exports = router;
