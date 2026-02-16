// Worker Routes for ConstruxFlow (UPDATED - Show All Jobs)
const express = require('express');
const db = require('../config/database');
const { isAuthenticated, isWorker } = require('../middleware/auth');
const router = express.Router();

// All routes require worker authentication
router.use(isAuthenticated);
router.use(isWorker);

// Get worker profile
router.get('/profile', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, phone, worker_type, profile_image FROM users WHERE id = ?', 
            [req.session.userId]);
        res.json({ success: true, user: users[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

// Browse ALL available jobs (UPDATED - Not filtered by worker type)
router.get('/jobs', async (req, res) => {
    try {
        // Get ALL projects with available vacancies
        const [jobs] = await db.query(`
            SELECT DISTINCT p.*, u.name as contractor_name,
            (SELECT COUNT(*) FROM worker_applications wa 
             WHERE wa.project_id = p.id AND wa.worker_id = ?) as already_applied,
            (SELECT GROUP_CONCAT(CONCAT(pmr.role_name, ':', pmr.required_count, ':', IFNULL(pmr.payment_per_day, 0)) SEPARATOR '|')
             FROM project_manpower_requirements pmr 
             WHERE pmr.project_id = p.id AND pmr.required_count > 0) as available_roles
            FROM projects p
            JOIN users u ON p.contractor_id = u.id
            WHERE p.end_date >= CURDATE()
            AND EXISTS (
                SELECT 1 FROM project_manpower_requirements pmr2 
                WHERE pmr2.project_id = p.id AND pmr2.required_count > 0
            )
            ORDER BY p.created_at DESC
        `, [req.session.userId]);

        // Parse the available roles for each job
        jobs.forEach(job => {
            if (job.available_roles) {
                const rolesData = job.available_roles.split('|').map(roleStr => {
                    const [role_name, required_count, payment] = roleStr.split(':');
                    return {
                        role_name,
                        required_count: parseInt(required_count),
                        payment_per_day: parseFloat(payment) || null
                    };
                });
                job.roles = rolesData;
            } else {
                job.roles = [];
            }
            delete job.available_roles;
        });

        res.json({ success: true, jobs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching jobs' });
    }
});

// Apply to job
router.post('/apply/:projectId', async (req, res) => {
    try {
        const projectId = req.params.projectId;

        // Check if already applied
        const [existing] = await db.query(
            'SELECT id FROM worker_applications WHERE project_id = ? AND worker_id = ?',
            [projectId, req.session.userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Already applied to this project' });
        }

        // Apply
        await db.query(
            'INSERT INTO worker_applications (project_id, worker_id) VALUES (?, ?)',
            [projectId, req.session.userId]
        );

        res.json({ success: true, message: 'Application submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting application' });
    }
});

// Get my applications
router.get('/applications', async (req, res) => {
    try {
        const [applications] = await db.query(`
            SELECT wa.*, p.project_name, p.location, p.start_date, p.end_date,
                   u.name as contractor_name, u.phone as contractor_phone
            FROM worker_applications wa
            JOIN projects p ON wa.project_id = p.id
            JOIN users u ON p.contractor_id = u.id
            WHERE wa.worker_id = ?
            ORDER BY wa.applied_at DESC
        `, [req.session.userId]);

        res.json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching applications' });
    }
});

// Get active jobs (approved applications)
router.get('/active-jobs', async (req, res) => {
    try {
        const [jobs] = await db.query(`
            SELECT wa.*, p.project_name, p.location, p.description, p.start_date, p.end_date,
                   u.name as contractor_name, u.phone as contractor_phone
            FROM worker_applications wa
            JOIN projects p ON wa.project_id = p.id
            JOIN users u ON p.contractor_id = u.id
            WHERE wa.worker_id = ? AND wa.status = 'approved'
            ORDER BY p.start_date DESC
        `, [req.session.userId]);

        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching active jobs' });
    }
});

// Rate contractor
router.post('/rate/contractor', async (req, res) => {
    try {
        const { contractor_id, project_id, rating, review } = req.body;

        if (!contractor_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Invalid rating' });
        }

        await db.query(`
            INSERT INTO ratings (rated_by, rated_to, project_id, rating, review)
            VALUES (?, ?, ?, ?, ?)
        `, [req.session.userId, contractor_id, project_id || null, rating, review || null]);

        res.json({ success: true, message: 'Rating submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting rating' });
    }
});

module.exports = router;
