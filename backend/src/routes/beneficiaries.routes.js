const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res) => {
    const allBeneficiaries = store.getBeneficiaries();

    const result = req.user.role === 'admin'
        ? allBeneficiaries
        : allBeneficiaries.filter(b => b.userId === req.user.id);

    res.json({ success: true, data: result });
});

router.post('/', (req, res) => {
    const beneficiaries = store.getBeneficiaries();

    const newBeneficiary = {
        id: Date.now(),
        userId: req.user.id,
        ...req.body,
        createdAt: new Date().toISOString()
    };

    beneficiaries.push(newBeneficiary);
    store.setBeneficiaries(beneficiaries);

    res.status(201).json({ success: true, data: newBeneficiary });
});

module.exports = router;