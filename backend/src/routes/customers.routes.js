const express = require('express');
const router = express.Router();
const { getAllCustomers, getCustomerById, updateCustomer } = require('../controllers/customers.controller');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticateToken);
router.use(authorizeRoles('admin'));   // Only admins can access customer management

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);

module.exports = router;