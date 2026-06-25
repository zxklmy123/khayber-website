const pool = require('../database/db');

async function getBeneficiaries(req, res) {
    try {
        const result = await pool.query(
            `SELECT *
             FROM beneficiaries
             WHERE user_id = $1
             AND status = 'active'
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Failed to load beneficiaries'
        });
    }
}

async function createBeneficiary(req, res) {
    const {
        full_name,
        phone,
        country,
        city,
        relationship
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO beneficiaries
            (user_id, full_name, phone, country, city, relationship)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *`,
            [
                req.user.id,
                full_name,
                phone,
                country,
                city,
                relationship
            ]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Failed to create beneficiary'
        });
    }
}

module.exports = {
    getBeneficiaries,
    createBeneficiary
};
