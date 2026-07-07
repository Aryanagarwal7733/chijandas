const fs = require('fs');
const { FALLBACK_PATH } = require('./db');
const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// Helper to read JSON fallback database
const readJsonDB = () => {
  try {
    const data = fs.readFileSync(FALLBACK_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON fallback database, resetting:', err);
    const emptyDb = { users: [], products: [], transactions: [] };
    writeJsonDB(emptyDb);
    return emptyDb;
  }
};

// Helper to write JSON fallback database
const writeJsonDB = (data) => {
  try {
    fs.writeFileSync(FALLBACK_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing JSON fallback database:', err);
  }
};

// Helper to generate a unique string ID
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const dbManager = {
  // --- USER OPERATIONS ---
  users: {
    findOne: async (query) => {
      if (global.dbType === 'mongodb') {
        return await User.findOne(query);
      } else {
        const db = readJsonDB();
        return db.users.find(u => {
          return Object.keys(query).every(key => u[key] === query[key]);
        }) || null;
      }
    },
    findById: async (id) => {
      if (global.dbType === 'mongodb') {
        return await User.findById(id);
      } else {
        const db = readJsonDB();
        return db.users.find(u => u._id === id) || null;
      }
    },
    create: async (userData) => {
      if (global.dbType === 'mongodb') {
        const user = new User(userData);
        return await user.save();
      } else {
        const db = readJsonDB();
        const newUser = {
          _id: generateId(),
          ...userData,
          createdAt: new Date().toISOString()
        };
        db.users.push(newUser);
        writeJsonDB(db);
        return newUser;
      }
    },
    find: async (query = {}) => {
      if (global.dbType === 'mongodb') {
        return await User.find(query);
      } else {
        const db = readJsonDB();
        return db.users.filter(u => {
          return Object.keys(query).every(key => u[key] === query[key]);
        });
      }
    }
  },

  // --- PRODUCT OPERATIONS ---
  products: {
    find: async (query = {}) => {
      if (global.dbType === 'mongodb') {
        return await Product.find(query);
      } else {
        const db = readJsonDB();
        return db.products.filter(p => {
          return Object.keys(query).every(key => {
            if (key === 'category' && query[key]) {
              return p.category.toLowerCase() === query[key].toLowerCase();
            }
            return p[key] === query[key];
          });
        });
      }
    },
    findById: async (id) => {
      if (global.dbType === 'mongodb') {
        return await Product.findById(id);
      } else {
        const db = readJsonDB();
        return db.products.find(p => p._id === id) || null;
      }
    },
    findOne: async (query) => {
      if (global.dbType === 'mongodb') {
        return await Product.findOne(query);
      } else {
        const db = readJsonDB();
        return db.products.find(p => {
          return Object.keys(query).every(key => p[key] === query[key]);
        }) || null;
      }
    },
    create: async (productData) => {
      if (global.dbType === 'mongodb') {
        const product = new Product(productData);
        return await product.save();
      } else {
        const db = readJsonDB();
        // Check for unique SKU
        if (db.products.some(p => p.sku === productData.sku)) {
          throw new Error(`Product with SKU ${productData.sku} already exists.`);
        }
        const newProduct = {
          _id: generateId(),
          ...productData,
          quantity: Number(productData.quantity) || 0,
          price: Number(productData.price) || 0,
          minStockLevel: Number(productData.minStockLevel) || 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.products.push(newProduct);
        writeJsonDB(db);
        return newProduct;
      }
    },
    findByIdAndUpdate: async (id, updateData) => {
      if (global.dbType === 'mongodb') {
        return await Product.findByIdAndUpdate(id, updateData, { new: true });
      } else {
        const db = readJsonDB();
        const index = db.products.findIndex(p => p._id === id);
        if (index === -1) return null;
        
        // Handle numbers conversions
        const numericUpdates = {};
        if (updateData.quantity !== undefined) numericUpdates.quantity = Number(updateData.quantity);
        if (updateData.price !== undefined) numericUpdates.price = Number(updateData.price);
        if (updateData.minStockLevel !== undefined) numericUpdates.minStockLevel = Number(updateData.minStockLevel);

        const updatedProduct = {
          ...db.products[index],
          ...updateData,
          ...numericUpdates,
          updatedAt: new Date().toISOString()
        };
        db.products[index] = updatedProduct;
        writeJsonDB(db);
        return updatedProduct;
      }
    },
    findByIdAndDelete: async (id) => {
      if (global.dbType === 'mongodb') {
        return await Product.findByIdAndDelete(id);
      } else {
        const db = readJsonDB();
        const index = db.products.findIndex(p => p._id === id);
        if (index === -1) return null;
        const deletedProduct = db.products[index];
        db.products.splice(index, 1);
        writeJsonDB(db);
        return deletedProduct;
      }
    }
  },

  // --- TRANSACTION OPERATIONS ---
  transactions: {
    find: async (query = {}, options = {}) => {
      if (global.dbType === 'mongodb') {
        let q = Transaction.find(query);
        if (options.sort) q = q.sort(options.sort);
        if (options.limit) q = q.limit(options.limit);
        return await q;
      } else {
        const db = readJsonDB();
        let list = db.transactions.filter(t => {
          return Object.keys(query).every(key => t[key] === query[key]);
        });
        // Sort (default timestamp desc)
        list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (options.limit) {
          list = list.slice(0, options.limit);
        }
        return list;
      }
    },
    create: async (transData) => {
      if (global.dbType === 'mongodb') {
        const transaction = new Transaction(transData);
        return await transaction.save();
      } else {
        const db = readJsonDB();
        const newTransaction = {
          _id: generateId(),
          ...transData,
          quantity: Number(transData.quantity),
          price: Number(transData.price),
          timestamp: new Date().toISOString()
        };
        db.transactions.unshift(newTransaction); // Add to beginning
        writeJsonDB(db);
        return newTransaction;
      }
    }
  }
};

module.exports = dbManager;
