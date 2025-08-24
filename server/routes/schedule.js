const express = require('express');
const router = express.Router();

// TODO: Implement schedule routes
router.get('/', (req, res) => {
  res.json({ message: 'Schedule route - Coming soon' });
});

module.exports = router;
