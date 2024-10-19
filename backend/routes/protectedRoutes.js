const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');

router.get('/protected-route', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

module.exports = router;
