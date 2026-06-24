const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const login = (req, res) => {
    const { email, role } = req.body;

    const user = {
        id: 1,
        name: 'Demo User',
        email: email || 'test@test.com',
        role: role || 'admin'
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1d' });

    res.json({
        success: true,
        message: 'Login successful',
        token,
        user
    });
};

const register = (req, res) => {
    res.json({
        success: true,
        message: 'Registration successful',
        user: {
            id: Date.now(),
            ...req.body
        }
    });
};

module.exports = {
    login,
    register
};