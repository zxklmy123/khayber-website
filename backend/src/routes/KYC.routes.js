const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticateToken);

router.get('/pending', authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM kyc_documents
             WHERE status = 'pending'
             ORDER BY created_at DESC`
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Load pending KYC error:', error);
        res.status(500).json({ success: false, message: 'Failed to load KYC documents' });
    }
});

router.post('/upload', async (req, res) => {
    try {
        const { document_type, document_number, file_path, notes } = req.body;

        if (!document_type) {
            return res.status(400).json({ success: false, message: 'Document type is required' });
        }

        const result = await pool.query(
            `INSERT INTO kyc_documents
                (user_id, user_name, document_type, document_number, file_path, notes, status)
             VALUES
                ($1,$2,$3,$4,$5,$6,'pending')
             RETURNING *`,
            [
                req.user.id,
                req.user.name,
                document_type,
                document_number || '',
                file_path || '',
                notes || ''
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('KYC upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload KYC document' });
    }
});

router.patch('/:id/status', authorizeRoles('admin'), async (req, res) => {
    try {
        const { status, notes } = req.body;

        const validStatuses = ['pending', 'approved', 'rejected'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid KYC status' });
        }

        const result = await pool.query(
            `UPDATE kyc_documents
             SET status = $1,
                 notes = COALESCE($2, notes),
                 reviewed_by = $3,
                 reviewed_at = NOW(),
                 updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [status, notes || null, req.user.id, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'KYC document not found' });
        }

        res.json({
            success: true,
            message: 'KYC status updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('KYC status update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update KYC status' });
    }
});

module.exports = router;
