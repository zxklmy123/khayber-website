const store = require('../data/store');

function getTransfers(req, res) {
    const allTransfers = store.getTransfers();
    const { role, id: userId } = req.user;

    let result = allTransfers;

    // Customers only see their own transfers
    if (role === 'customer') {
        result = allTransfers.filter(t => t.userId === userId);
    }

    // Optional filter by status
    if (req.query.status) {
        result = result.filter(t => t.status === req.query.status);
    }

    res.json({ success: true, data: result });
}

function createTransfer(req, res) {
    const { beneficiary, amountAUD, currency, rate, fee, receiveAmount, method, purpose, notes } = req.body;
    const { id: userId, name } = req.user;

    if (!beneficiary || !amountAUD || !currency) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const transfers = store.getTransfers();

    const newTransfer = {
        id: `HP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`,
        userId,
        beneficiary,
        amountAUD: parseFloat(amountAUD),
        currency,
        rate: parseFloat(rate) || 58.35,
        fee: parseFloat(fee) || 15,
        receiveAmount: parseFloat(receiveAmount) || Math.round(amountAUD * 58),
        method: method || 'online',
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        purpose: purpose || 'Family support',
        notes: notes || ''
    };

    transfers.unshift(newTransfer);
    store.setTransfers(transfers);

    // Update user stats
    const users = store.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].totalTransfers = (users[userIndex].totalTransfers || 0) + 1;
        users[userIndex].totalVolume = (users[userIndex].totalVolume || 0) + parseFloat(amountAUD);
        store.setUsers(users);
    }

    // Audit log
    const auditLogs = store.getAuditLogs();
    auditLogs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user: `${name} (customer)`,
        action: 'TRANSFER_CREATED',
        details: `Created transfer ${newTransfer.id} for $${amountAUD}`,
        ip: req.ip || 'unknown'
    });
    store.setAuditLogs(auditLogs);

    res.status(201).json({
        success: true,
        message: 'Transfer created successfully',
        data: newTransfer
    });
}

function updateTransferStatus(req, res) {
    const { id } = req.params;
    const { status, notes } = req.body;
    const { name, role } = req.user;

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const transfers = store.getTransfers();
    const index = transfers.findIndex(t => t.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    const oldStatus = transfers[index].status;
    transfers[index].status = status;

    if (notes) {
        transfers[index].notes = (transfers[index].notes || '') + ` | ${notes}`;
    }

    store.setTransfers(transfers);

    // Audit log
    const auditLogs = store.getAuditLogs();
    auditLogs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user: `${name} (${role})`,
        action: 'ORDER_STATUS_CHANGED',
        details: `Transfer ${id}: ${oldStatus} → ${status}`,
        ip: req.ip || 'unknown'
    });
    store.setAuditLogs(auditLogs);

    res.json({
        success: true,
        message: 'Status updated',
        data: transfers[index]
    });
}

module.exports = {
    getTransfers,
    createTransfer,
    updateTransferStatus
};