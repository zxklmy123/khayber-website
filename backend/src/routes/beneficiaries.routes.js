const express = require('express');
const router = express.Router();

const {
    getBeneficiaries,
    createBeneficiary
} = require('../controllers/beneficiaries.controller');

const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', getBeneficiaries);

router.post('/', createBeneficiary);

module.exports = router;
