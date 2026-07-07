const express = require('express');
const router = express.Router();
const dbManager = require('../config/dbManager');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// @route   GET api/stats
// @desc    Get dashboard summary statistics (Admin only)
// @access  Private/Admin
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const products = await dbManager.products.find({});
    const transactions = await dbManager.transactions.find({});

    // Summary counts
    const totalProducts = products.length;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    // Category aggregation
    const categoriesMap = {};

    products.forEach(p => {
      const price = Number(p.price) || 0;
      const quantity = Number(p.quantity) || 0;
      const minStock = Number(p.minStockLevel) || 5;
      
      totalValue += price * quantity;
      
      if (quantity === 0) {
        outOfStockCount++;
      } else if (quantity <= minStock) {
        lowStockCount++;
      }

      // Group by category
      const cat = p.category || 'Other';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          category: cat,
          count: 0,
          value: 0,
          stock: 0
        };
      }
      categoriesMap[cat].count += 1;
      categoriesMap[cat].value += price * quantity;
      categoriesMap[cat].stock += quantity;
    });

    const categories = Object.values(categoriesMap);

    // Sales/Order aggregation (last 7 days or total)
    let totalSalesValue = 0;
    let totalOrdersCount = 0;
    
    // Filter orders
    const orders = transactions.filter(t => t.type === 'order');
    totalOrdersCount = orders.length;
    orders.forEach(o => {
      const qty = Number(o.quantity) || 0;
      const price = Number(o.price) || 0;
      totalSalesValue += qty * price;
    });

    // Recent activity logs
    const recentActivity = transactions.slice(0, 5).map(t => ({
      id: t._id,
      productName: t.productName,
      userName: t.userName,
      type: t.type,
      quantity: t.quantity,
      price: t.price,
      timestamp: t.timestamp
    }));

    res.json({
      summary: {
        totalProducts,
        totalValue: parseFloat(totalValue.toFixed(2)),
        lowStockCount,
        outOfStockCount,
        totalOrdersCount,
        totalSalesValue: parseFloat(totalSalesValue.toFixed(2))
      },
      categories,
      recentActivity
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error retrieving statistics' });
  }
});

module.exports = router;
