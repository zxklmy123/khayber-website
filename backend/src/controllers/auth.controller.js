const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../middleware/auth');
const pool = require('../database/db');

const login = async (req, res) => {
    const { email, password, loginMode } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND status = $2',
            [email, 'active']
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];
        const passwordOk = bcrypt.compareSync(password, user.password_hash);

        if (!passwordOk) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (loginMode === 'admin' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Administrator access required'
            });
        }

        await pool.query(
            'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1',
            [user.id]
        );

        const tokenUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(tokenUser, JWT_SECRET, { expiresIn: '1d' });

        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                kycStatus: user.kyc_status,
                joined: user.created_at,
                totalTransfers: Number(user.total_transfers || 0),
                totalVolume: Number(user.total_volume || 0)
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

const register = async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email and password are required'
        });
    }

    try {
        const exists = await pool.query(
            'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        if (exists.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'An account already exists with this email'
            });
        }

        const passwordHash = bcrypt.hashSync(password, 10);

        const result = await pool.query(
            `INSERT INTO users
                (name, email, phone, password_hash, role, kyc_status, status)
             VALUES
                ($1, $2, $3, $4, 'customer', 'pending', 'active')
             RETURNING id, name, email, phone, role, kyc_status, created_at, total_transfers, total_volume`,
            [name, email, phone || '', passwordHash]
        );

        const user = result.rows[0];

        const tokenUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(tokenUser, JWT_SECRET, { expiresIn: '1d' });

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                kycStatus: user.kyc_status,
                joined: user.created_at,
                totalTransfers: Number(user.total_transfers || 0),
                totalVolume: Number(user.total_volume || 0)
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        return res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

module.exports = {
    login,
    register
};