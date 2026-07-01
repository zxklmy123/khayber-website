const pool = require('../database/db');

const BASE = 'AUD';

const currencies = {
  AFN: { country: 'Afghanistan', margin: 0.40 },
  PKR: { country: 'Pakistan', margin: 2.00 },
  INR: { country: 'India', margin: 1.00 },
  AED: { country: 'UAE', margin: 0 },
  USD: { country: 'USA', margin: 0.01 },
  IRR: { country: 'Iran', percent: 1 },
  AUD: { country: 'Australia', margin: 0.01 }
};

function applyMargin(marketRate, config) {
  if (config.percent) {
    return marketRate - (marketRate * config.percent / 100);
  }

  return marketRate - (config.margin || 0);
}

async function syncLiveRates() {
  const response = await fetch(`https://open.er-api.com/v6/latest/${BASE}`);
  const data = await response.json();

  if (!data || !data.rates) {
    throw new Error('Invalid rates response');
  }

  const tiers = [
    { tier: 'below-3000', feeFixed: 18, feePercent: 0.65, adjustment: 0 },
    { tier: '3000-10000', feeFixed: 12, feePercent: 0.55, adjustment: 0 },
    { tier: 'above-10000', feeFixed: 6, feePercent: 0.40, adjustment: 0 }
  ];

  for (const code of Object.keys(currencies)) {
    const config = currencies[code];

    const marketRate = code === BASE ? 1 : data.rates[code];
    if (!marketRate) continue;

    const baseCustomerRate = applyMargin(Number(marketRate), config);

    for (const item of tiers) {
      const finalRate = Number((baseCustomerRate + item.adjustment).toFixed(4));

      await pool.query(
        `INSERT INTO exchange_rates
          (currency, transfer_type, tier, rate, fee_fixed, fee_percent, is_active, updated_at)
         VALUES
          ($1, 'online', $2, $3, $4, $5, TRUE, NOW())
         ON CONFLICT (currency, transfer_type, tier)
         DO UPDATE SET
          rate = EXCLUDED.rate,
          fee_fixed = EXCLUDED.fee_fixed,
          fee_percent = EXCLUDED.fee_percent,
          is_active = TRUE,
          updated_at = NOW()`,
        [code, item.tier, finalRate, item.feeFixed, item.feePercent]
      );
    }
  }

  return data;
}

async function getRates(req, res) {
  try {
    await syncLiveRates();

    const result = await pool.query(
      `SELECT currency, transfer_type, tier, rate, fee_fixed, fee_percent, updated_at
       FROM exchange_rates
       WHERE is_active = TRUE
       ORDER BY currency, transfer_type, tier`
    );

    const rates = {};

    result.rows.forEach(r => {
      if (!rates[r.currency]) {
        rates[r.currency] = {
          country: currencies[r.currency]?.country || r.currency
        };
      }

      if (!rates[r.currency][r.transfer_type]) {
        rates[r.currency][r.transfer_type] = {};
      }

      rates[r.currency][r.transfer_type][r.tier] = {
        rate: Number(r.rate),
        feeFixed: Number(r.fee_fixed),
        feePercent: Number(r.fee_percent)
      };
    });

    res.json({
      success: true,
      source: 'open.er-api.com',
      base: BASE,
      updatedAt: new Date(),
      data: rates
    });

  } catch (error) {
    console.error('Get rates error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load live rates'
    });
  }
}

async function updateRates(req, res) {
  try {
    await syncLiveRates();

    res.json({
      success: true,
      message: 'Live rates synced successfully'
    });

  } catch (error) {
    console.error('Sync rates error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to sync live rates'
    });
  }
}

module.exports = {
  getRates,
  updateRates
};