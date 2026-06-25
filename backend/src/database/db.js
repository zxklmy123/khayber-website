const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://walishabgeer@localhost:5432/khayber_services'
});

module.exports = pool;
