// Authentication Routes for ConstruxFlow
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, role, worker_type } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'All fields required' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Password length validation
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Check if email already exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, phone, role, worker_type) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phone || null, role, worker_type || null]
        );

        res.json({ success: true, message: 'Registration successful! Please login.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        // Find user
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = users[0];

        // Check if blocked
        if (user.is_blocked) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked' });
        }

        // Verify password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Create session
        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.name = user.name;

        res.json({ 
            success: true, 
            message: 'Login successful',
            role: user.role 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user info
router.get('/me', (req, res) => {
    if (req.session.userId) {
        res.json({
            success: true,
            user: {
                id: req.session.userId,
                name: req.session.name,
                role: req.session.role
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
    }
});

module.exports = router;
