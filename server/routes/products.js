const express = require('express');
const router = express.Router();
const dbManager = require('../config/dbManager');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// @route   GET api/products
// @desc    Get all products
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const products = await dbManager.products.find({});
    res.json(products);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ message: 'Server error retrieving products' });
  }
});

// @route   GET api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await dbManager.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Get product by ID error:', err);
    res.status(500).json({ message: 'Server error retrieving product' });
  }
});

// @route   POST api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, sku, category, quantity, price, minStockLevel, description } = req.body;

    if (!name || !sku || !category || price === undefined) {
      return res.status(400).json({ message: 'Name, SKU, category and price are required fields' });
    }

    // Check if sku exists
    const existing = await dbManager.products.findOne({ sku });
    if (existing) {
      return res.status(400).json({ message: `A product with SKU "${sku}" already exists` });
    }

    const newProduct = await dbManager.products.create({
      name,
      sku,
      category,
      quantity: Number(quantity) || 0,
      price: Number(price),
      minStockLevel: Number(minStockLevel) || 5,
      description: description || ''
    });

    // Log transaction
    await dbManager.transactions.create({
      productId: newProduct._id.toString(),
      productName: newProduct.name,
      userName: req.user.username,
      type: 'in',
      quantity: newProduct.quantity,
      price: newProduct.price
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: err.message || 'Server error creating product' });
  }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, sku, category, quantity, price, minStockLevel, description } = req.body;

    const product = await dbManager.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check SKU unique if changed
    if (sku && sku !== product.sku) {
      const existing = await dbManager.products.findOne({ sku });
      if (existing) {
        return res.status(400).json({ message: `A product with SKU "${sku}" already exists` });
      }
    }

    const previousQty = product.quantity;
    const updated = await dbManager.products.findByIdAndUpdate(req.params.id, {
      name: name || product.name,
      sku: sku || product.sku,
      category: category || product.category,
      quantity: quantity !== undefined ? Number(quantity) : product.quantity,
      price: price !== undefined ? Number(price) : product.price,
      minStockLevel: minStockLevel !== undefined ? Number(minStockLevel) : product.minStockLevel,
      description: description !== undefined ? description : product.description
    });

    // If quantity was increased/decreased, log a transaction
    if (quantity !== undefined && Number(quantity) !== previousQty) {
      const difference = Number(quantity) - previousQty;
      await dbManager.transactions.create({
        productId: req.params.id,
        productName: updated.name,
        userName: req.user.username,
        type: difference > 0 ? 'in' : 'out',
        quantity: Math.abs(difference),
        price: updated.price
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const product = await dbManager.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await dbManager.products.findByIdAndDelete(req.params.id);

    // Log deletion transaction
    await dbManager.transactions.create({
      productId: req.params.id,
      productName: product.name,
      userName: req.user.username,
      type: 'out',
      quantity: product.quantity,
      price: product.price
    });

    res.json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

// @route   POST api/products/:id/order
// @desc    Place order (reduce stock)
// @access  Private
router.post('/:id/order', authenticate, async (req, res) => {
  try {
    const { quantity, shippingAddress, paymentMethod } = req.body;
    const reqQty = Number(quantity) || 1;

    if (!shippingAddress || !shippingAddress.trim()) {
      return res.status(400).json({ message: 'Shipping address is required to place an order.' });
    }

    if (!paymentMethod || !paymentMethod.trim()) {
      return res.status(400).json({ message: 'Payment method is required to place an order.' });
    }

    const payMethod = paymentMethod.trim().toUpperCase();
    if (payMethod !== 'UPI' && payMethod !== 'COD') {
      return res.status(400).json({ message: 'Invalid payment method. Only UPI and COD are accepted.' });
    }

    const product = await dbManager.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.quantity < reqQty) {
      return res.status(400).json({ message: `Insufficient stock. Only ${product.quantity} items left.` });
    }

    // Deduct stock
    const updated = await dbManager.products.findByIdAndUpdate(req.params.id, {
      quantity: product.quantity - reqQty
    });

    // Log transaction as 'order'
    const transaction = await dbManager.transactions.create({
      productId: req.params.id,
      productName: product.name,
      userName: req.user.username,
      type: 'order',
      quantity: reqQty,
      price: product.price,
      shippingAddress: shippingAddress.trim(),
      paymentMethod: payMethod
    });

    // Save user address for future purchases
    await dbManager.users.findByIdAndUpdate(req.user.id, { savedAddress: shippingAddress.trim() });

    // Send order confirmation email asynchronously
    const { sendOrderConfirmation } = require('../services/emailService');
    sendOrderConfirmation(req.user.email, req.user.username, {
      orderId: transaction._id,
      productName: product.name,
      quantity: reqQty,
      price: product.price,
      shippingAddress: shippingAddress.trim(),
      paymentMethod: payMethod
    }).catch(err => console.error('Failed to send confirmation email:', err));

    res.json({ message: 'Order placed successfully', product: updated });
  } catch (err) {
    console.error('Order product error:', err);
    res.status(500).json({ message: 'Server error placing order' });
  }
});

module.exports = router;
