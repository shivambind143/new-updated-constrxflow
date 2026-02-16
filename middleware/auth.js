// Authentication Middleware for ConstruxFlow

// Check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Please login first' });
}

// Check if user is a contractor
function isContractor(req, res, next) {
    if (req.session && req.session.role === 'contractor') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Contractor access only' });
}

// Check if user is a worker
function isWorker(req, res, next) {
    if (req.session && req.session.role === 'worker') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Worker access only' });
}

// Check if user is a supplier
function isSupplier(req, res, next) {
    if (req.session && req.session.role === 'supplier') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Supplier access only' });
}

// Check if user is admin
function isAdmin(req, res, next) {
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Admin access only' });
}

module.exports = {
    isAuthenticated,
    isContractor,
    isWorker,
    isSupplier,
    isAdmin
};
