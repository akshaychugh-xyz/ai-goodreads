const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { generateToken, hashPassword, comparePassword } = require('../auth');

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    
    const query = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email';
    const result = await db.query(query, [email, hashedPassword]);
    
    const newUser = result.rows[0];
    const token = generateToken(newUser);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: { id: newUser.id, email: newUser.email },
      token 
    });
  } catch (error) {
    console.error('Error registering user:', error);
    if (error.code === '23505') { // unique_violation error code
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Error registering user' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    res.json({ 
      message: 'Login successful',
      user: { id: user.id, email: user.email },
      token 
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
