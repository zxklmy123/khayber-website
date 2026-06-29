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


const bcrypt = require('bcryptjs');
const pool = require('./src/database/db');

app.get('/api/admin-reset-once', async (req, res) => {
  const token = req.query.token;

  if (token !== 'RESET-KHAYBER-2026') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const hash = bcrypt.hashSync('Admin@12345', 10);

  await pool.query(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE email = 'admin@khayberservices.com.au'`,
    [hash]
  );

  res.json({ success: true, message: 'Admin password reset' });
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
