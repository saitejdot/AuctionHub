const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Add timeout so it fails fast instead of buffering forever
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to primary MongoDB: ${error.message}`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Starting fallback in-memory MongoDB server...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri);
        console.log(`Fallback In-Memory MongoDB connected at ${mongoUri}`);
      } catch (fallbackError) {
        console.error(`Error starting fallback DB: ${fallbackError.message}`);
      }
    } else {
      console.error('Failed to connect to production database.');
    }
  }
};

module.exports = connectDB;
