const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const dbManager = require('./config/dbManager');

// Load environment variables relative to this file
dotenv.config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
  try {
    // Connect to DB (will set global.dbType)
    await connectDB();

    console.log(`Seeding database in ${global.dbType.toUpperCase()} mode...`);

    // Reset collections if in MongoDB
    if (global.dbType === 'mongodb') {
      const mongoose = require('mongoose');
      await mongoose.connection.dropDatabase().catch(err => {
        console.log('Database drop failed or was already clean. Continuing...');
      });
      console.log('Cleared existing MongoDB collections.');
    } else {
      const fs = require('fs');
      const { FALLBACK_PATH } = require('./config/db');
      fs.writeFileSync(FALLBACK_PATH, JSON.stringify({
        users: [],
        products: [],
        transactions: []
      }, null, 2));
      console.log('Cleared existing fallback JSON file.');
    }

    // 1. Create seed users
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@chijandas.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash(adminPass, salt);
    const userPassword = await bcrypt.hash('user123', salt);

    console.log('Creating users...');
    const admin = await dbManager.users.create({
      username: 'Admin Chijandas',
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin',
      phoneNumber: '9999999999'
    });

    const user = await dbManager.users.create({
      username: 'Aryan Customer',
      email: 'user@chijandas.com',
      password: userPassword,
      role: 'user',
      phoneNumber: '9876543210'
    });

    console.log('Users created:');
    console.log(`- Admin: ${adminEmail} / ${adminPass}`);
    console.log(`- User: user@chijandas.com / user123`);

    // 2. Create products
    console.log('Creating products...');
    const seedProducts = [
      // Food Products
      {
        name: 'Basmati Rice (5kg)',
        sku: 'FOOD-RICE-001',
        category: 'Food Products',
        quantity: 50,
        price: 12.99,
        minStockLevel: 10,
        description: 'Premium long-grain Basmati Rice, aged for maximum flavor.'
      },
      {
        name: 'Whole Milk (1 Gallon)',
        sku: 'FOOD-MILK-002',
        category: 'Food Products',
        quantity: 30,
        price: 3.49,
        minStockLevel: 8,
        description: 'Fresh pasteurized organic whole milk from local dairies.'
      },
      {
        name: 'Organic Eggs (12-pack)',
        sku: 'FOOD-EGGS-003',
        category: 'Food Products',
        quantity: 40,
        price: 4.29,
        minStockLevel: 12,
        description: 'Farm fresh organic brown eggs, free-range.'
      },
      {
        name: 'Whole Wheat Bread',
        sku: 'FOOD-BREAD-004',
        category: 'Food Products',
        quantity: 4, // LOW STOCK!
        price: 2.99,
        minStockLevel: 8,
        description: 'Freshly baked whole wheat bread, high in fiber.'
      },
      {
        name: 'Chocolate Chip Cookies',
        sku: 'FOOD-COOK-005',
        category: 'Food Products',
        quantity: 0, // OUT OF STOCK!
        price: 1.99,
        minStockLevel: 5,
        description: 'Delicious chocolate chip cookies, baked fresh daily.'
      },
      // Kitchen Products
      {
        name: 'Stainless Steel Chef Knife',
        sku: 'KTCH-KNIF-001',
        category: 'Kitchen Products',
        quantity: 15,
        price: 24.99,
        minStockLevel: 3,
        description: 'Professional 8-inch high-carbon stainless steel chef\'s knife.'
      },
      {
        name: 'Non-Stick Frying Pan',
        sku: 'KTCH-PAN-002',
        category: 'Kitchen Products',
        quantity: 20,
        price: 29.99,
        minStockLevel: 4,
        description: '10-inch aluminum non-stick frying pan, dishwasher safe.'
      },
      {
        name: 'Electric Blender',
        sku: 'KTCH-BLND-003',
        category: 'Kitchen Products',
        quantity: 2, // LOW STOCK!
        price: 49.99,
        minStockLevel: 5,
        description: 'High-speed 1000W countertop blender for smoothies and purees.'
      },
      {
        name: 'Ceramic Coffee Mug',
        sku: 'KTCH-MUG-004',
        category: 'Kitchen Products',
        quantity: 60,
        price: 5.99,
        minStockLevel: 10,
        description: 'Dishwasher and microwave safe ceramic coffee mug, 350ml.'
      },
      {
        name: 'Silicone Spatula Set (3pc)',
        sku: 'KTCH-SPAT-005',
        category: 'Kitchen Products',
        quantity: 35,
        price: 9.99,
        minStockLevel: 6,
        description: 'Heat-resistant, BPA-free silicone kitchen spatula set.'
      }
    ];

    for (const prod of seedProducts) {
      const createdProd = await dbManager.products.create(prod);
      
      // Create an initial stock transaction log if quantity is greater than 0
      if (createdProd.quantity > 0) {
        await dbManager.transactions.create({
          productId: createdProd._id.toString(),
          productName: createdProd.name,
          userName: 'Admin Chijandas',
          type: 'in',
          quantity: createdProd.quantity,
          price: createdProd.price,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log('>>> Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
