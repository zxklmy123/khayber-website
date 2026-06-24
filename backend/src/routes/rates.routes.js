const express = require('express');
const router = express.Router();
const { getRates, updateRates } = require('../controllers/rates.controller');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

// Public - View rates
router.get('/', getRates);

// Admin only - Update rates
router.put('/', authenticateToken, authorizeRoles('admin'), updateRates);

module.exports = router;