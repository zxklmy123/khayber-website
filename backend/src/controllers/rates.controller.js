const BASE = 'AUD';

const currencies = {
  AFN: { country: 'Afghanistan', margin: 0.40 },
  PKR: { country: 'Pakistan', margin: 2 },
  INR: { country: 'India', margin: 1 },
  AED: { country: 'UAE', margin: 0 },
  USD: { country: 'USA', margin: 0 },
  IRR: { country: 'Iran', percent: 1 },
  AUD: { country: 'Australia', margin: 0.01 }
};

const getRates = async (req, res) => {
  try {

    const response = await fetch('https://open.er-api.com/v6/latest/AUD');

    const data = await response.json();

    const output = {};

    Object.keys(currencies).forEach(code => {

      const config = currencies[code];

      let marketRate =
        code === 'AUD'
          ? 1
          : data.rates[code];

      if (!marketRate) return;

      let customerRate;

      if (config.percent) {
        customerRate =
          marketRate - (marketRate * config.percent / 100);
      } else {
        customerRate =
          marketRate - config.margin;
      }

      output[code] = {
        country: config.country,
        currency: code,

        online: {
          rate: Number(customerRate.toFixed(4)),
          fee: 10,
          time: '1-2 hours'
        },

        cash: {
          rate: Number(customerRate.toFixed(4)),
          fee: 15,
          time: 'Same day'
        }
      };

    });

    res.json({
      success: true,
      source: 'open.er-api.com',
      updatedAt: new Date(),
      data: output
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: 'Failed to load live rates'
    });

  }
};

const updateRates = (req, res) => {

  res.json({
    success: true,
    message: 'Live mode enabled'
  });

};

module.exports = {
  getRates,
  updateRates
};