const pool = require('../database/db');

function generateReferenceNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `HP-${date}-${random}`;
}

async function getTransfers(req, res) {
    try {
        const { role, id: userId } = req.user;
        const { status } = req.query;

        let query = `
            SELECT
                t.*,
                b.full_name AS beneficiary_full_name,
                b.city AS beneficiary_city,
                b.country AS beneficiary_country,
                u.name AS customer_name,
                u.email AS customer_email
            FROM transfers t
            LEFT JOIN beneficiaries b ON t.beneficiary_id = b.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;

        const params = [];

        if (role === 'customer') {
            params.push(userId);
            query += ` AND t.user_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            query += ` AND t.status = $${params.length}`;
        }

        query += ` ORDER BY t.created_at DESC`;

        const result = await pool.query(query, params);

        const transfers = result.rows.map(t => ({
            id: t.reference_no,
            dbId: t.id,
            userId: t.user_id,
            customerName: t.customer_name,
            customerEmail: t.customer_email,
            beneficiaryId: t.beneficiary_id,
            beneficiary: t.beneficiary_name || t.beneficiary_full_name,
            amountAUD: Number(t.amount_aud),
            currency: t.currency,
            rate: Number(t.exchange_rate),
            fee: Number(t.fee),
            receiveAmount: Number(t.receive_amount),
            method: t.payment_method,
            status: t.status,
            date: t.created_at ? t.created_at.toISOString().split('T')[0] : '',
            purpose: t.purpose,
            notes: t.notes || ''
        }));

        res.json({
            success: true,
            data: transfers
        });

    } catch (error) {
        console.error('Get transfers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load transfers'
        });
    }
}

async function createTransfer(req, res) {
    const {
        beneficiaryId,
        beneficiary,
        amountAUD,
        currency,
        rate,
        fee,
        receiveAmount,
        method,
        purpose,
        notes
    } = req.body;

    const { id: userId, name } = req.user;

    if (!amountAUD || !currency) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    try {
        let finalBeneficiaryId = beneficiaryId || null;
        let finalBeneficiaryName = beneficiary || '';

        if (finalBeneficiaryId) {
            const benResult = await pool.query(
                `SELECT id, full_name
                 FROM beneficiaries
                 WHERE id = $1
                 AND user_id = $2
                 AND status = 'active'`,
                [finalBeneficiaryId, userId]
            );

            if (benResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid beneficiary'
                });
            }

            finalBeneficiaryName = benResult.rows[0].full_name;
        }

        if (!finalBeneficiaryName) {
            return res.status(400).json({
                success: false,
                message: 'Beneficiary is required'
            });
        }

        const referenceNo = generateReferenceNo();

        const insertResult = await pool.query(
            `INSERT INTO transfers
                (
                    reference_no,
                    user_id,
                    beneficiary_id,
                    beneficiary_name,
                    amount_aud,
                    currency,
                    exchange_rate,
                    fee,
                    receive_amount,
                    payment_method,
                    purpose,
                    status,
                    notes
                )
             VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12)
             RETURNING *`,
            [
                referenceNo,
                userId,
                finalBeneficiaryId,
                finalBeneficiaryName,
                Number(amountAUD),
                currency,
                Number(rate || 58.35),
                Number(fee || 0),
                Number(receiveAmount || Math.round(Number(amountAUD) * Number(rate || 58.35))),
                method || 'online',
                purpose || 'Family support',
                notes || ''
            ]
        );

        const newTransfer = insertResult.rows[0];

        await pool.query(
            `UPDATE users
             SET total_transfers = total_transfers + 1,
                 total_volume = total_volume + $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [Number(amountAUD), userId]
        );

        await pool.query(
            `INSERT INTO audit_logs
                (user_id, user_name, action, entity, entity_id, details, ip_address)
             VALUES
                ($1,$2,'TRANSFER_CREATED','transfer',$3,$4,$5)`,
            [
                userId,
                `${name} (customer)`,
                newTransfer.id,
                `Created transfer ${referenceNo} for AUD ${amountAUD}`,
                req.ip || 'unknown'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Transfer created successfully',
            data: {
                id: newTransfer.reference_no,
                dbId: newTransfer.id,
                beneficiary: newTransfer.beneficiary_name,
                amountAUD: Number(newTransfer.amount_aud),
                currency: newTransfer.currency,
                rate: Number(newTransfer.exchange_rate),
                fee: Number(newTransfer.fee),
                receiveAmount: Number(newTransfer.receive_amount),
                method: newTransfer.payment_method,
                status: newTransfer.status,
                date: newTransfer.created_at.toISOString().split('T')[0],
                purpose: newTransfer.purpose,
                notes: newTransfer.notes || ''
            }
        });

    } catch (error) {
        console.error('Create transfer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create transfer'
        });
    }
}

async function updateTransferStatus(req, res) {
    const { id } = req.params;
    const { status, notes } = req.body;
    const { id: userId, name, role } = req.user;

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status'
        });
    }

    try {
        const existing = await pool.query(
            `SELECT *
             FROM transfers
             WHERE reference_no = $1 OR id::text = $1`,
            [id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transfer not found'
            });
        }

        const oldTransfer = existing.rows[0];

        const updateResult = await pool.query(
            `UPDATE transfers
             SET status = $1,
                 notes = CASE
                    WHEN $2::text IS NULL OR $2::text = '' THEN notes
                    ELSE COALESCE(notes, '') || ' | ' || $2
                 END,
                 completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
                 updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [status, notes || '', oldTransfer.id]
        );

        const updated = updateResult.rows[0];

        await pool.query(
            `INSERT INTO audit_logs
                (user_id, user_name, action, entity, entity_id, details, ip_address)
             VALUES
                ($1,$2,'ORDER_STATUS_CHANGED','transfer',$3,$4,$5)`,
            [
                userId,
                `${name} (${role})`,
                updated.id,
                `Transfer ${updated.reference_no}: ${oldTransfer.status} → ${status}`,
                req.ip || 'unknown'
            ]
        );

        res.json({
            success: true,
            message: 'Status updated',
            data: {
                id: updated.reference_no,
                dbId: updated.id,
                beneficiary: updated.beneficiary_name,
                amountAUD: Number(updated.amount_aud),
                currency: updated.currency,
                rate: Number(updated.exchange_rate),
                fee: Number(updated.fee),
                receiveAmount: Number(updated.receive_amount),
                method: updated.payment_method,
                status: updated.status,
                date: updated.created_at.toISOString().split('T')[0],
                purpose: updated.purpose,
                notes: updated.notes || ''
            }
        });

    } catch (error) {
        console.error('Update transfer status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update transfer status'
        });
    }
}

module.exports = {
    getTransfers,
    createTransfer,
    updateTransferStatus
};
