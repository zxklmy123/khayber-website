let users = [];
let transfers = [];
let rates = {};
let beneficiaries = [];
let kycDocuments = [];
let news = [];
let auditLogs = [];


//seedData();

module.exports = {
    getUsers: () => users,
    setUsers: (data) => users = data,
    getTransfers: () => transfers,
    setTransfers: (data) => transfers = data,
    getRates: () => rates,
    setRates: (data) => rates = data,
    getBeneficiaries: () => beneficiaries,
    setBeneficiaries: (data) => beneficiaries = data,
    getKycDocuments: () => kycDocuments,
    setKycDocuments: (data) => kycDocuments = data,
    getNews: () => news,
    setNews: (data) => news = data,
    getAuditLogs: () => auditLogs,
    setAuditLogs: (data) => auditLogs = data
};
