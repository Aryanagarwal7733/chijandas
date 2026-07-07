const express = require('express');
const router = express.Router();
const dbManager = require('../config/dbManager');
const { authenticate } = require('../middleware/auth');

// @route   GET api/transactions
// @desc    Get transaction logs (Admins get all, Users get their own)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.userName = req.user.username;
    }

    // Limit to last 50 transactions for performance
    const transactions = await dbManager.transactions.find(query, { limit: 50 });
    res.json(transactions);
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ message: 'Server error retrieving transactions' });
  }
});

module.exports = router;
