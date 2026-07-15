import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatsphere';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000, // Timeout fast so we can fall back quickly
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.useMockDB = false;
  } catch (error) {
    console.warn(`\n⚠️  [DATABASE WARNING] MongoDB connection failed: ${error.message}`);
    console.warn(`👉 Automatically falling back to local file-based JSON database mode.\n`);
    global.useMockDB = true;
  }
};

export default connectDB;
