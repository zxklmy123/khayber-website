const express = require('express');
const router = express.Router();
const { getTransfers, createTransfer, updateTransferStatus } = require('../controllers/transfers.controller');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticateToken);

router.get('/', getTransfers);
router.post('/', createTransfer);

// Only admin can change status
router.patch('/:id/status', authorizeRoles('admin'), updateTransferStatus);

module.exports = router;