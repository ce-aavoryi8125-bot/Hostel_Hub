const express = require('express');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, error } = require('../utils/apiResponse');

const Manager = require('../models/Manager');
const Transaction = require('../models/Transaction');
const Hostel = require('../models/Hostel');

const router = express.Router();

router.use(authenticateToken, requireManager);

// MANAGER FINANCES
router.get('/finances', asyncHandler(async (req, res) => {
  const managerId = req.user.sub;
  const [manager, txs, hostels] = await Promise.all([
    Manager.findById(managerId),
    Transaction.find({ managerId }).sort({ createdAt: -1 }),
    Hostel.find({ managerId }, 'name _id')
  ]);

  if (!manager) return error(res, 'Manager not found', 404);

  const totalIncome  = txs.filter(t => t.type === 'income' ).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return res.json({
    bankDetails:  manager.bankDetails || null,
    transactions: txs,
    hostels:      hostels.map(h => ({ id: h._id, name: h.name })),
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense
  });
}));

// LOG EXPENSE
router.post('/expenses', asyncHandler(async (req, res) => {
  const { hostelId, amount, category, description } = req.body;
  if (!amount || !category || !description) return error(res, 'Amount, category, and description are required', 400);

  const managerId = req.user.sub;
  let hostelName  = 'General Operation';

  if (hostelId) {
    const hostel = await Hostel.findOne({ _id: hostelId, managerId });
    if (hostel) hostelName = hostel.name;
  }

  const tx = await Transaction.create({
    managerId,
    hostelId:    hostelId || null,
    hostelName,
    type:        'expense',
    amount:      Number(amount),
    category:    String(category).trim(),
    description: String(description).trim()
  });

  return res.status(201).json({ message: 'Expense logged successfully', transaction: tx });
}));

// SAVE BANK ACCOUNT
router.post('/bank-account', asyncHandler(async (req, res) => {
  const { bankName, accountName, accountNumber } = req.body;
  if (!bankName || !accountName || !accountNumber) return error(res, 'All bank details are required', 400);

  const manager = await Manager.findByIdAndUpdate(
    req.user.sub,
    { bankDetails: { bankName: String(bankName).trim(), accountName: String(accountName).trim(), accountNumber: String(accountNumber).trim() } },
    { new: true }
  );

  if (!manager) return error(res, 'Manager not found', 404);
  return res.json({ message: 'Bank account linked successfully', bankDetails: manager.bankDetails });
}));

module.exports = router;
