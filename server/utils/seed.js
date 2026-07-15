import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatsphere');
    console.log('MongoDB Connected for seeding...');

    // Clear collections
    await User.deleteMany();
    await Chat.deleteMany();
    await Message.deleteMany();
    console.log('Cleared existing MongoDB chat collections.');

    // Password hashes
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('user123', salt);

    // 1. Create Users
    const alice = await User.create({
      name: 'Alice (Chatbot)',
      email: 'alice@chatsphere.com',
      password: hashedPassword,
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      status: 'online',
    });

    const bob = await User.create({
      name: 'Bob (Tech Support)',
      email: 'bob@chatsphere.com',
      password: hashedPassword,
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      status: 'online',
    });

    const ai = await User.create({
      _id: new mongoose.Types.ObjectId('64ae99999999999999999999'), // Use stable ID for AI Bot
      name: 'ChatSphere AI (Assistant)',
      email: 'ai@chatsphere.com',
      password: hashedPassword,
      profilePhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
      status: 'online',
    });

    const john = await User.create({
      name: 'John Doe',
      email: 'user@chatsphere.com',
      password: hashedPassword,
      profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      status: 'offline',
    });

    console.log('Seeded User accounts successfully.');

    // 2. Create Chat Room between John and Alice
    const chat = await Chat.create({
      isGroupChat: false,
      chatName: 'Alice (Chatbot)',
      members: [alice._id, john._id],
    });

    // 3. Create Welcome Message
    const msg = await Message.create({
      sender: alice._id,
      content: 'Hey John! Welcome to ChatSphere. Send me a message, and I will write back to you in real-time!',
      chat: chat._id,
      seenBy: [alice._id],
    });

    chat.lastMessage = msg._id;
    await chat.save();

    // 4. Create Chat Room between John and AI
    const chatAI = await Chat.create({
      isGroupChat: false,
      chatName: 'ChatSphere AI (Assistant)',
      members: [ai._id, john._id],
    });

    const msgAI = await Message.create({
      sender: ai._id,
      content: 'Hello John! I am your ChatSphere AI Assistant. You can ask me questions, compute calculations, or play clean dev jokes. Type "help" to see my list of skills!',
      chat: chatAI._id,
      seenBy: [ai._id],
    });

    chatAI.lastMessage = msgAI;
    await chatAI.save();

    console.log('Seeded Welcome Chat & Messages successfully.');
    console.log('Seeding process completed.');
    process.exit(0);
  } catch (error) {
    console.error('MongoDB Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
