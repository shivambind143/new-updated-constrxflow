// Supplier Routes for ConstruxFlow (UPDATED)
const express = require('express');
const db = require('../config/database');
const { isAuthenticated, isSupplier } = require('../middleware/auth');
const router = express.Router();

// All routes require supplier authentication
router.use(isAuthenticated);
router.use(isSupplier);

// Get supplier profile
router.get('/profile', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, phone, profile_image FROM users WHERE id = ?', 
            [req.session.userId]);
        res.json({ success: true, user: users[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

// Get inventory
router.get('/inventory', async (req, res) => {
    try {
        const [inventory] = await db.query(
            'SELECT * FROM supplier_inventory WHERE supplier_id = ? ORDER BY created_at DESC',
            [req.session.userId]
        );
        res.json({ success: true, inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching inventory' });
    }
});

// Add material to inventory (UPDATED - accepts any text unit)
router.post('/inventory', async (req, res) => {
    try {
        const { material_name, quantity, unit, price_per_unit } = req.body;

        if (!material_name || !quantity || !unit || !price_per_unit) {
            return res.status(400).json({ success: false, message: 'All fields required' });
        }

        // Trim and validate unit is not empty
        const trimmedUnit = unit.trim();
        if (!trimmedUnit) {
            return res.status(400).json({ success: false, message: 'Unit cannot be empty' });
        }

        await db.query(`
            INSERT INTO supplier_inventory (supplier_id, material_name, quantity, unit, price_per_unit)
            VALUES (?, ?, ?, ?, ?)
        `, [req.session.userId, material_name, quantity, trimmedUnit, price_per_unit]);

        res.json({ success: true, message: 'Material added to inventory' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error adding material' });
    }
});

// Update inventory item
router.put('/inventory/:id', async (req, res) => {
    try {
        const { quantity, price_per_unit } = req.body;
        const itemId = req.params.id;

        await db.query(`
            UPDATE supplier_inventory 
            SET quantity = ?, price_per_unit = ?
            WHERE id = ? AND supplier_id = ?
        `, [quantity, price_per_unit, itemId, req.session.userId]);

        res.json({ success: true, message: 'Inventory updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating inventory' });
    }
});

// Get order requests
router.get('/orders', async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, si.material_name, si.unit, 
                   u.name as contractor_name, u.phone as contractor_phone,
                   p.project_name
            FROM orders o
            JOIN supplier_inventory si ON o.material_id = si.id
            JOIN users u ON o.contractor_id = u.id
            JOIN projects p ON o.project_id = p.id
            WHERE o.supplier_id = ?
            ORDER BY o.ordered_at DESC
        `, [req.session.userId]);

        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Accept/Reject order
router.post('/orders/:id/:action', async (req, res) => {
    try {
        const { id, action } = req.params;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        // Get order details
        const [orders] = await db.query('SELECT * FROM orders WHERE id = ? AND supplier_id = ?', 
            [id, req.session.userId]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[0];
        const status = action === 'approve' ? 'approved' : 'rejected';

        // Update order status
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

        // If approved, reduce inventory
        if (status === 'approved') {
            await db.query(`
                UPDATE supplier_inventory 
                SET quantity = quantity - ?
                WHERE id = ?
            `, [order.quantity, order.material_id]);
        }

        res.json({ success: true, message: `Order ${status} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating order' });
    }
});

// Rate contractor
router.post('/rate/contractor', async (req, res) => {
    try {
        const { contractor_id, rating, review } = req.body;

        if (!contractor_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Invalid rating' });
        }

        await db.query(`
            INSERT INTO ratings (rated_by, rated_to, rating, review)
            VALUES (?, ?, ?, ?)
        `, [req.session.userId, contractor_id, rating, review || null]);

        res.json({ success: true, message: 'Rating submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting rating' });
    }
});

module.exports = router;
