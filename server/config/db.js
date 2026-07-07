const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Global database status flag
global.dbType = 'mongodb'; 

// Fallback JSON DB path
const FALLBACK_DIR = path.join(__dirname, '..', 'data');
const FALLBACK_PATH = path.join(FALLBACK_DIR, 'fallback_db.json');

// Ensure fallback directory and file exist
if (!fs.existsSync(FALLBACK_DIR)) {
  fs.mkdirSync(FALLBACK_DIR, { recursive: true });
}
if (!fs.existsSync(FALLBACK_PATH)) {
  fs.writeFileSync(FALLBACK_PATH, JSON.stringify({
    users: [],
    products: [],
    transactions: []
  }, null, 2));
}

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chijandas';
    console.log(`Connecting to MongoDB at: ${connString}...`);
    
    // Connect with a 3-second timeout so it doesn't hang forever if MongoDB is not running
    await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 3000
    });
    
    global.dbType = 'mongodb';
    console.log('>>> SUCCESS: MongoDB Connected successfully.');
  } catch (err) {
    global.dbType = 'json';
    console.warn('\n============================================================');
    console.warn('>>> WARNING: MongoDB connection failed!');
    console.warn(`Reason: ${err.message}`);
    console.warn('>>> FALLBACK: Switching to local JSON Database (server/data/fallback_db.json).');
    console.warn('Everything will still work, but changes will be stored locally in JSON.');
    console.warn('============================================================\n');
  }
};

module.exports = { connectDB, FALLBACK_PATH };
