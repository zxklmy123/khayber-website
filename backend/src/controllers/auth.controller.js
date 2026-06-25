const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../middleware/auth');
const store = require('../data/store');

const login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    const users = store.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    const passwordOk = bcrypt.compareSync(password, user.password);

    if (!passwordOk) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    const tokenUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'customer'
    };

    const token = jwt.sign(tokenUser, JWT_SECRET, { expiresIn: '1d' });

    res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role || 'customer',
            kycStatus: user.kycStatus || 'pending',
            joined: user.joined,
            totalTransfers: user.totalTransfers || 0,
            totalVolume: user.totalVolume || 0
        }
    });
};

const register = (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email and password are required'
        });
    }

    const users = store.getUsers();

    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (exists) {
        return res.status(409).json({
            success: false,
            message: 'An account already exists with this email'
        });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
        id: Date.now(),
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
        role: 'customer',
        kycStatus: 'pending',
        joined: new Date().toISOString().split('T')[0],
        totalTransfers: 0,
        totalVolume: 0
    };

    users.push(newUser);
    store.setUsers(users);

    const tokenUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
    };

    const token = jwt.sign(tokenUser, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            kycStatus: newUser.kycStatus,
            joined: newUser.joined,
            totalTransfers: 0,
            totalVolume: 0
        }
    });
};

module.exports = {
    login,
    register
};