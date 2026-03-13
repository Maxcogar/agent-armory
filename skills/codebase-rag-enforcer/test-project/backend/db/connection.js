const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-project';

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('Database disconnected');
}

module.exports = { connectDB, disconnectDB };
