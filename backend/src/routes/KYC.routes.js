const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticateToken);

router.get('/pending', authorizeRoles('admin'), (req, res) => {
    const kycDocs = store.getKycDocuments();
    res.json({ success: true, data: kycDocs.filter(d => d.status === 'pending') });
});

router.post('/upload', (req, res) => {
    const kycDocs = store.getKycDocuments();
    const newDoc = {
        id: Date.now(),
        userId: req.user.id,
        userName: req.user.name,
        ...req.body,
        status: 'pending',
        uploadedAt: new Date().toISOString()
    };
    kycDocs.push(newDoc);
    store.setKycDocuments(kycDocs);
    
    res.status(201).json({ success: true, message: 'Document uploaded successfully', data: newDoc });
});

module.exports = router;