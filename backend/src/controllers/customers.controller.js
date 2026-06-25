const store = require('../data/store');

function getAllCustomers(req, res) {
    const users = store.getUsers();
    // Remove password before sending
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json({ success: true, data: safeUsers });
}

function getCustomerById(req, res) {
    const users = store.getUsers();
    const user = users.find(u => u.id === parseInt(req.params.id));

    if (!user) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const { password, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
}

function updateCustomer(req, res) {
    const users = store.getUsers();
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updatedData = req.body;
    delete updatedData.password; // Prevent password update this way

    users[userIndex] = {
    ...users[userIndex],
    ...updatedData
    };

    store.setUsers(users);

    const { password, ...safeUser } = users[userIndex];

    res.json({
        success: true,
        message: 'Customer updated successfully',
        data: safeUser
    });
}

module.exports = {
    getAllCustomers,
    getCustomerById,
    updateCustomer
};