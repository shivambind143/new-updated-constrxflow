// Admin Routes for ConstruxFlow
const express = require('express');
const db = require('../config/database');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const router = express.Router();

// All routes require admin authentication
router.use(isAuthenticated);
router.use(isAdmin);

// Get all users
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT id, name, email, phone, role, worker_type, created_at, is_blocked
            FROM users
            WHERE role != 'admin'
            ORDER BY created_at DESC
        `);
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
});

// Block/Unblock user
router.post('/users/:id/block', async (req, res) => {
    try {
        const userId = req.params.id;
        const { block } = req.body; // true or false

        await db.query('UPDATE users SET is_blocked = ? WHERE id = ?', [block, userId]);

        res.json({ success: true, message: block ? 'User blocked' : 'User unblocked' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating user' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
});

// Get all projects
router.get('/projects', async (req, res) => {
    try {
        const [projects] = await db.query(`
            SELECT p.*, u.name as contractor_name
            FROM projects p
            JOIN users u ON p.contractor_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, projects });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching projects' });
    }
});

// Get all orders
router.get('/orders', async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, 
                   si.material_name,
                   c.name as contractor_name,
                   s.name as supplier_name,
                   p.project_name
            FROM orders o
            JOIN supplier_inventory si ON o.material_id = si.id
            JOIN users c ON o.contractor_id = c.id
            JOIN users s ON o.supplier_id = s.id
            JOIN projects p ON o.project_id = p.id
            ORDER BY o.ordered_at DESC
        `);
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Get statistics
router.get('/statistics', async (req, res) => {
    try {
        const [userStats] = await db.query(`
            SELECT role, COUNT(*) as count 
            FROM users 
            WHERE role != 'admin'
            GROUP BY role
        `);

        const [projectCount] = await db.query('SELECT COUNT(*) as count FROM projects');
        const [orderCount] = await db.query('SELECT COUNT(*) as count FROM orders');
        const [applicationCount] = await db.query('SELECT COUNT(*) as count FROM worker_applications');

        res.json({ 
            success: true, 
            statistics: {
                users: userStats,
                totalProjects: projectCount[0].count,
                totalOrders: orderCount[0].count,
                totalApplications: applicationCount[0].count
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

module.exports = router;
