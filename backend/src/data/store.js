let users = [];
let transfers = [];
let rates = {};
let beneficiaries = [];
let kycDocuments = [];
let news = [];
let auditLogs = [];
let isSeeded = false;

function seedData() {
    if (isSeeded) return;

    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('demo123', 10);

    users = [
        {
            id: 1,
            name: "Anisa Mangal",
            email: "anisa@khayber-demo.com.au",
            phone: "+61 412 987 654",
            password: hashedPassword,
            role: "customer",
            kycStatus: "verified",
            joined: "2023-11-14",
            totalTransfers: 47,
            totalVolume: 124800
        },
        {
            id: 99,
            name: "Admin User",
            email: "admin@khayberservices.com.au",
            phone: "+61 400 000 000",
            password: hashedPassword,
            role: "admin",
            kycStatus: "verified",
            joined: "2023-01-01",
            totalTransfers: 0,
            totalVolume: 0
        }
    ];

    rates = {
        AFN: {
            name: "Afghan Afghani",
            flag: "🇦🇫",
            online: {
                "below-3000": { rate: 57.85, feeFixed: 18, feePercent: 0.65 },
                "3000-10000": { rate: 58.35, feeFixed: 12, feePercent: 0.55 },
                "above-10000": { rate: 58.85, feeFixed: 6, feePercent: 0.40 }
            },
            cash: {
                "below-3000": { rate: 57.40, feeFixed: 22, feePercent: 0.80 },
                "3000-10000": { rate: 57.90, feeFixed: 15, feePercent: 0.70 },
                "above-10000": { rate: 58.35, feeFixed: 8, feePercent: 0.55 }
            }
        },
        AED: {
            name: "UAE Dirham",
            flag: "🇦🇪",
            online: {
                "below-3000": { rate: 2.41, feeFixed: 15, feePercent: 0.55 },
                "3000-10000": { rate: 2.435, feeFixed: 10, feePercent: 0.45 },
                "above-10000": { rate: 2.455, feeFixed: 5, feePercent: 0.35 }
            },
            cash: {
                "below-3000": { rate: 2.38, feeFixed: 18, feePercent: 0.65 },
                "3000-10000": { rate: 2.405, feeFixed: 12, feePercent: 0.55 },
                "above-10000": { rate: 2.425, feeFixed: 6, feePercent: 0.45 }
            }
        }
    };

    transfers = [
        {
            id: "HP-20260620-7841",
            userId: 1,
            beneficiary: "Mohammad Gul - Kabul",
            amountAUD: 1850,
            currency: "AFN",
            rate: 58.35,
            fee: 15.5,
            receiveAmount: 107947,
            method: "online",
            status: "completed",
            date: "2026-06-20",
            purpose: "Family support",
            notes: ""
        }
    ];

    isSeeded = true;
    console.log('✅ Mock data seeded');
}

seedData();

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