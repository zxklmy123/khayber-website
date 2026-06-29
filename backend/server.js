const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/auth.routes');
const ratesRoutes = require('./src/routes/rates.routes');
const transfersRoutes = require('./src/routes/transfers.routes');
const beneficiariesRoutes = require('./src/routes/beneficiaries.routes');
const customersRoutes = require('./src/routes/customers.routes');
const kycRoutes = require('./src/routes/KYC.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Khayber Services backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/beneficiaries', beneficiariesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/kyc', kycRoutes);


// ================= NEWS =================

let newsItems = [
  {
    id: 1,
    title: 'Welcome to Khayber Services',
    excerpt: 'Latest updates and announcements will appear here.',
    published: true,
    date: new Date().toISOString()
  }
];

app.get('/api/news', (req, res) => {
  res.json({
    success: true,
    data: newsItems
  });
});

app.post('/api/news', (req, res) => {
  const item = {
    id: Date.now(),
    title: req.body.title || '',
    excerpt: req.body.excerpt || '',
    published: req.body.published ?? true,
    date: new Date().toISOString()
  };

  newsItems.unshift(item);

  res.json({
    success: true,
    data: item
  });
});


app.get('/api/audit-logs', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});



app.get('/api/create-admin-once', async (req, res) => {
  const token = req.query.token;

  if (token !== 'CREATE-KHAYBER-ADMIN-2026') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const bcrypt = require('bcryptjs');
  const pool = require('./src/database/db');

  const hash = bcrypt.hashSync('Admin@12345', 10);

  const result = await pool.query(`
    INSERT INTO users
      (name, email, phone, password_hash, role, kyc_status, status)
    VALUES
      ('Khayber Admin', 'admin@khayberservices.com.au', '+61400000000', $1, 'admin', 'verified', 'active')
    ON CONFLICT (email)
    DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = 'admin',
      status = 'active',
      kyc_status = 'verified',
      updated_at = NOW()
    RETURNING id, name, email, role, status
  `, [hash]);

  res.json({ success: true, admin: result.rows[0] });
});

// ================= SERVE FRONTEND =================

const publicPath = path.join(__dirname, '..', 'public');

app.use(express.static(publicPath));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
