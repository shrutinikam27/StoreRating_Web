const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');
const seedDatabase = require('./config/seed');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes Setup
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/stores'));

// Root API Endpoint
app.get('/', (req, res) => {
  res.send({ message: 'Store Rating Platform API is running.' });
});

// Start Database and Server
const startServer = async () => {
  try {
    console.log('Initializing database connection...');
    await initializeDatabase();
    
    // Import models to ensure tables are registered
    const models = require('./models');
    
    // Sync models with database
    console.log('Syncing database models...');
    await models.User.sequelize.sync({ alter: true });
    console.log('Database synced successfully.');
    
    // Seed initial database content if empty
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
