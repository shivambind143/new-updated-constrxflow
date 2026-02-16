// Contractor Routes for ConstruxFlow (UPDATED)
const express = require('express');
const db = require('../config/database');
const { isAuthenticated, isContractor } = require('../middleware/auth');
const router = express.Router();

// All routes require contractor authentication
router.use(isAuthenticated);
router.use(isContractor);

// Get contractor profile
router.get('/profile', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, phone, profile_image FROM users WHERE id = ?', [req.session.userId]);
        res.json({ success: true, user: users[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

// Get all projects with manpower details
router.get('/projects', async (req, res) => {
    try {
        const [projects] = await db.query(`
            SELECT p.*,
            (SELECT COUNT(*) FROM worker_applications wa WHERE wa.project_id = p.id AND wa.status = 'approved') as workers_count,
            (SELECT COUNT(*) FROM orders o WHERE o.project_id = p.id AND o.status = 'approved') as materials_ordered
            FROM projects p
            WHERE p.contractor_id = ?
            ORDER BY p.created_at DESC
        `, [req.session.userId]);
        
        // Get manpower requirements for each project
        for (let project of projects) {
            const [manpower] = await db.query(
                'SELECT * FROM project_manpower_requirements WHERE project_id = ?',
                [project.id]
            );
            project.manpower_requirements = manpower;
        }
        
        res.json({ success: true, projects });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching projects' });
    }
});

// Get single project details with manpower
router.get('/projects/:id', async (req, res) => {
    try {
        const [projects] = await db.query('SELECT * FROM projects WHERE id = ? AND contractor_id = ?', 
            [req.params.id, req.session.userId]);
        
        if (projects.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Get manpower requirements
        const [manpower] = await db.query(
            'SELECT * FROM project_manpower_requirements WHERE project_id = ?',
            [req.params.id]
        );
        
        projects[0].manpower_requirements = manpower;
        res.json({ success: true, project: projects[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching project' });
    }
});

// Add new project with dynamic manpower
router.post('/projects', async (req, res) => {
    try {
        const { 
            project_name, description, location, 
            start_date, end_date,
            manpower_requirements // Array of {role_name, required_count, payment_per_day}
        } = req.body;

        if (!project_name || !location || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        if (!manpower_requirements || manpower_requirements.length === 0) {
            return res.status(400).json({ success: false, message: 'Please add at least one manpower requirement' });
        }

        // Insert project
        const [result] = await db.query(`
            INSERT INTO projects (contractor_id, project_name, description, location, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [req.session.userId, project_name, description, location, start_date, end_date]);

        const projectId = result.insertId;

        // Insert manpower requirements
        for (let manpower of manpower_requirements) {
            if (manpower.role_name && manpower.required_count) {
                await db.query(`
                    INSERT INTO project_manpower_requirements (project_id, role_name, required_count, payment_per_day)
                    VALUES (?, ?, ?, ?)
                `, [projectId, manpower.role_name, manpower.required_count, manpower.payment_per_day || null]);
            }
        }

        res.json({ success: true, message: 'Project created successfully', projectId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating project' });
    }
});

// Get worker applications for contractor's projects
router.get('/applications', async (req, res) => {
    try {
        const [applications] = await db.query(`
            SELECT wa.*, u.name as worker_name, u.worker_type, u.phone, p.project_name
            FROM worker_applications wa
            JOIN users u ON wa.worker_id = u.id
            JOIN projects p ON wa.project_id = p.id
            WHERE p.contractor_id = ?
            ORDER BY wa.applied_at DESC
        `, [req.session.userId]);

        res.json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching applications' });
    }
});

// Approve/Reject worker application (UPDATED to reduce manpower count)
router.post('/applications/:id/:action', async (req, res) => {
    try {
        const { id, action } = req.params;
        
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        const status = action === 'approve' ? 'approved' : 'rejected';

        // Get application details
        const [applications] = await db.query(`
            SELECT wa.*, u.worker_type 
            FROM worker_applications wa
            JOIN users u ON wa.worker_id = u.id
            WHERE wa.id = ?
        `, [id]);

        if (applications.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const application = applications[0];

        // Update application status
        await db.query('UPDATE worker_applications SET status = ? WHERE id = ?', [status, id]);

        // If approved, reduce manpower count
        if (status === 'approved') {
            await db.query(`
                UPDATE project_manpower_requirements 
                SET required_count = required_count - 1
                WHERE project_id = ? AND role_name = ? AND required_count > 0
            `, [application.project_id, application.worker_type]);
        }

        res.json({ success: true, message: `Application ${status} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating application' });
    }
});

// Search materials
router.get('/materials/search', async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        
        const [materials] = await db.query(`
            SELECT si.*, u.name as supplier_name, u.phone as supplier_phone
            FROM supplier_inventory si
            JOIN users u ON si.supplier_id = u.id
            WHERE si.material_name LIKE ? AND si.quantity > 0
            ORDER BY si.price_per_unit
        `, [`%${searchTerm}%`]);

        res.json({ success: true, materials });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching materials' });
    }
});

// Place material order
router.post('/orders', async (req, res) => {
    try {
        const { project_id, material_id, quantity } = req.body;

        // Get material details
        const [materials] = await db.query('SELECT * FROM supplier_inventory WHERE id = ?', [material_id]);
        
        if (materials.length === 0) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        const material = materials[0];
        const total_price = material.price_per_unit * quantity;

        // Create order
        await db.query(`
            INSERT INTO orders (project_id, contractor_id, supplier_id, material_id, quantity, total_price)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [project_id, req.session.userId, material.supplier_id, material_id, quantity, total_price]);

        res.json({ success: true, message: 'Order placed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error placing order' });
    }
});

// Get orders for contractor
router.get('/orders', async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, si.material_name, si.unit, u.name as supplier_name, u.phone as supplier_phone,
                   p.project_name
            FROM orders o
            JOIN supplier_inventory si ON o.material_id = si.id
            JOIN users u ON o.supplier_id = u.id
            JOIN projects p ON o.project_id = p.id
            WHERE o.contractor_id = ?
            ORDER BY o.ordered_at DESC
        `, [req.session.userId]);

        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Rate worker
router.post('/rate/worker', async (req, res) => {
    try {
        const { worker_id, project_id, rating, review } = req.body;

        if (!worker_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Invalid rating' });
        }

        await db.query(`
            INSERT INTO ratings (rated_by, rated_to, project_id, rating, review)
            VALUES (?, ?, ?, ?, ?)
        `, [req.session.userId, worker_id, project_id || null, rating, review || null]);

        res.json({ success: true, message: 'Rating submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting rating' });
    }
});

// Rate supplier
router.post('/rate/supplier', async (req, res) => {
    try {
        const { supplier_id, rating, review } = req.body;

        if (!supplier_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Invalid rating' });
        }

        await db.query(`
            INSERT INTO ratings (rated_by, rated_to, rating, review)
            VALUES (?, ?, ?, ?)
        `, [req.session.userId, supplier_id, rating, review || null]);

        res.json({ success: true, message: 'Rating submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting rating' });
    }
});

module.exports = router;
