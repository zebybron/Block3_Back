const jwt = require('jsonwebtoken');
const mongoService = require('../services/mongoService');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Token manquant',
            message: 'Un token d\'authentification est requis.'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Token invalide',
                message: 'Le token d\'authentification n\'est pas valide.'
            });
        }

        // Passer les données du token
        req.userId = user.id;
        req.userEmail = user.email;
        req.userRole = user.role;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (!req.userRole || req.userRole !== 'admin') {
        return res.status(403).json({
            error: 'Accès refusé',
            message: 'Droits d\'administrateur requis.'
        });
    }
    next();
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (!err) {
                req.userId = user.id;
                req.userEmail = user.email;
                req.userRole = user.role;
            }
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    optionalAuth
};
