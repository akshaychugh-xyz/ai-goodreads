const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { generateToken, hashPassword, comparePassword } = require('../auth');

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      const token = generateToken({ id: this.lastID, email });
      res.json({ token });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for email:', email);
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isValid = await comparePassword(password, user.password);
    console.log('Password validation result:', isValid);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = generateToken({ id: user.id, email: user.email });
    res.json({ token });
  });
});

module.exports = router;