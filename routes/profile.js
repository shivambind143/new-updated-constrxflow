// Profile Management Routes for ConstruxFlow (All Roles)
const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/profiles/');
    },
    filename: function (req, file, cb) {
        const uniqueName = 'profile-' + req.session.userId + '-' + Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only JPG and PNG images are allowed'));
        }
    }
});

// All routes require authentication
router.use(isAuthenticated);

// Get user profile
router.get('/', async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, phone, role, worker_type, profile_image, created_at, is_blocked FROM users WHERE id = ?',
            [req.session.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, user: users[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

// Update basic information (name, email, phone)
router.put('/update', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        // Validation
        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and email are required' });
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }
        
        // Phone validation (not empty if provided)
        if (phone !== undefined && phone !== null && phone.trim() === '') {
            return res.status(400).json({ success: false, message: 'Phone number cannot be empty' });
        }
        
        // Check if email is already used by another user
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, req.session.userId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already in use by another account' });
        }
        
        // Update user
        await db.query(
            'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
            [name, email, phone || null, req.session.userId]
        );
        
        // Update session name
        req.session.name = name;
        
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

// Change password
router.put('/change-password', async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        // Validation
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both old and new passwords are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }
        
        // Get current password from database
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.session.userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Verify old password
        const match = await bcrypt.compare(oldPassword, users[0].password);
        
        if (!match) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.session.userId]);
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error changing password' });
    }
});

// Upload profile image
router.post('/upload-image', upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }
        
        const imageUrl = '/uploads/profiles/' + req.file.filename;
        
        // Update user's profile image
        await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [imageUrl, req.session.userId]);
        
        res.json({ 
            success: true, 
            message: 'Profile image updated successfully',
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Error uploading image' });
    }
});

module.exports = router;
