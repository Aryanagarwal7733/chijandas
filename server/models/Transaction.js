const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  productId: {
    type: String, // String representation or ObjectId
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['in', 'out', 'order'], // 'in' = stock added, 'out' = stock removed manually, 'order' = user order
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number, // Unit price or total price at transaction time
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
