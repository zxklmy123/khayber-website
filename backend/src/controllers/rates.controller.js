const pool = require('../database/db');

async function getRates(req, res) {
    try {
        const result = await pool.query(
            `SELECT currency, transfer_type, tier, rate, fee_fixed, fee_percent
             FROM exchange_rates
             WHERE is_active = TRUE
             ORDER BY currency, transfer_type, tier`
        );

        const rates = {};

        result.rows.forEach(r => {
            if (!rates[r.currency]) rates[r.currency] = {};
            if (!rates[r.currency][r.transfer_type]) rates[r.currency][r.transfer_type] = {};

            rates[r.currency][r.transfer_type][r.tier] = {
                rate: Number(r.rate),
                feeFixed: Number(r.fee_fixed),
                feePercent: Number(r.fee_percent)
            };
        });

        res.json({ success: true, data: rates });

    } catch (error) {
        console.error('Get rates error:', error);
        res.status(500).json({ success: false, message: 'Failed to load rates' });
    }
}

async function updateRates(req, res) {
    const { currency, transfer_type, tier, rate, feeFixed, feePercent } = req.body;

    if (!currency || !transfer_type || !tier || rate === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO exchange_rates
                (currency, transfer_type, tier, rate, fee_fixed, fee_percent)
             VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT (currency, transfer_type, tier)
             DO UPDATE SET
                rate = EXCLUDED.rate,
                fee_fixed = EXCLUDED.fee_fixed,
                fee_percent = EXCLUDED.fee_percent,
                updated_at = NOW()
             RETURNING *`,
            [
                currency,
                transfer_type,
                tier,
                Number(rate),
                Number(feeFixed || 0),
                Number(feePercent || 0)
            ]
        );

        res.json({
            success: true,
            message: 'Rate updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Update rates error:', error);
        res.status(500).json({ success: false, message: 'Failed to update rate' });
    }
}

module.exports = { getRates, updateRates };
