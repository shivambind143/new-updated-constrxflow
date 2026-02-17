// ConstruxFlow - Construction Management System
// Main Server File (UPDATED with Profile Management)

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const db = require('./config/database');
const auth = require('./middleware/auth');

const app = express();
// const PORT = 3000;
// this will use for render delopy
const PORT = process.env.PORT || 3000;


// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    // secret: 'construxflow-secret-key-2024',
    // the above one is for local host 
    secret: process.env.SESSION_SECRET || 'defaultsecret',

    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Routes
const authRoutes = require('./routes/auth');
const contractorRoutes = require('./routes/contractor');
const workerRoutes = require('./routes/worker');
const supplierRoutes = require('./routes/supplier');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile'); // NEW

app.use('/api/auth', authRoutes);
app.use('/api/contractor', contractorRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes); // NEW

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/contractor-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contractor-dashboard.html'));
});

app.get('/worker-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'worker-dashboard.html'));
});

app.get('/supplier-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'supplier-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Profile pages (NEW)
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ConstruxFlow server running on http://localhost:${PORT}`);
});
