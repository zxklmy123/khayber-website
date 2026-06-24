const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'khayber-services-secret-key-change-in-production';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }
        req.user = user; // { id, email, role, name }
        next();
    });
}

module.exports = { authenticateToken, JWT_SECRET };