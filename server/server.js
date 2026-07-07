const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');
const statsRoutes = require('./routes/stats');

// Route configurations
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);

// Base route
app.get('/', (req, res) => {
  res.send(`Chijandas Backend API is running... DB Mode: ${global.dbType}`);
});

const PORT = process.env.PORT || 5000;

// Initialize Database and Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n============================================================`);
    console.log(`Server started on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}`);
    console.log(`Running in ${global.dbType.toUpperCase()} mode.`);
    console.log(`============================================================\n`);
  });
};

startServer();
