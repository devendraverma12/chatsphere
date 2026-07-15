import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const __dirname = path.resolve();
const dbPath = path.join(__dirname, 'data', 'db.json');

// Helper to check if file exists, else initialize
const initJsonDb = () => {
  const dirPath = path.join(__dirname, 'data');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], chats: [], messages: [] }, null, 2));
  }
};

const readData = () => {
  initJsonDb();
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading JSON DB file:', error);
    return { users: [], chats: [], messages: [] };
  }
};

const writeData = (data) => {
  initJsonDb();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing JSON DB file:', error);
  }
};

// Seed initial bots and user if empty
export const seedMockData = async (hashedUserPassword) => {
  initJsonDb();
  const data = readData();

  if (data.users.length === 0) {
    let hashedPassword = hashedUserPassword;
    if (!hashedPassword) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash('user123', salt);
    }

    // Generate UUIDs for default mock users
    const userBotAlice = {
      _id: 'alice_bot_id_123',
      name: 'Alice (Chatbot)',
      email: 'alice@chatsphere.com',
      password: hashedPassword,
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      status: 'online',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const userBotBob = {
      _id: 'bob_bot_id_456',
      name: 'Bob (Tech Support)',
      email: 'bob@chatsphere.com',
      password: hashedPassword,
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      status: 'online',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const userBotAI = {
      _id: 'ai_bot_id_999',
      name: 'ChatSphere AI (Assistant)',
      email: 'ai@chatsphere.com',
      password: hashedPassword,
      profilePhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
      status: 'online',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const user1 = {
      _id: 'user_john_id_789',
      name: 'John Doe',
      email: 'user@chatsphere.com',
      password: hashedPassword, // Password is 'user123'
      profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      status: 'offline',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    data.users.push(userBotAlice, userBotBob, userBotAI, user1);
    
    // Seed a welcome chat between Alice and John
    const chat1 = {
      _id: 'chat_alice_john_id',
      isGroupChat: false,
      chatName: 'Alice (Chatbot)',
      members: ['alice_bot_id_123', 'user_john_id_789'],
      lastMessage: null,
      createdAt: new Date().toISOString(),
    };

    const msg1 = {
      _id: 'msg_welcome_id_001',
      sender: 'alice_bot_id_123',
      content: 'Hey John! Welcome to ChatSphere. Send me a message, and I will write back to you in real-time!',
      chat: 'chat_alice_john_id',
      messageType: 'text',
      fileUrl: '',
      seenBy: ['alice_bot_id_123'],
      createdAt: new Date().toISOString(),
    };

    chat1.lastMessage = msg1;
    data.chats.push(chat1);
    data.messages.push(msg1);

    // Seed a welcome chat between AI and John
    const chatAI = {
      _id: 'chat_ai_john_id',
      isGroupChat: false,
      chatName: 'ChatSphere AI (Assistant)',
      members: ['ai_bot_id_999', 'user_john_id_789'],
      lastMessage: null,
      createdAt: new Date().toISOString(),
    };

    const msgAI = {
      _id: 'msg_welcome_ai_001',
      sender: 'ai_bot_id_999',
      content: 'Hello John! I am your ChatSphere AI Assistant. You can ask me questions, compute calculations, or play clean dev jokes. Type "help" to see my list of skills!',
      chat: 'chat_ai_john_id',
      messageType: 'text',
      fileUrl: '',
      seenBy: ['ai_bot_id_999'],
      createdAt: new Date().toISOString(),
    };

    chatAI.lastMessage = msgAI;
    data.chats.push(chatAI);
    data.messages.push(msgAI);

    writeData(data);
    console.log('Seeded local JSON database successfully with chatbot and AI assistant.');
  }
};

// Unified DB Service
export const dbService = {
  // --- USERS ---
  async getUsers() {
    const data = readData();
    return data.users;
  },

  async getUserById(id) {
    const data = readData();
    return data.users.find((u) => u._id === id);
  },

  async getUserByEmail(email) {
    const data = readData();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  async createUser(user) {
    const data = readData();
    const newUser = {
      _id: crypto.randomBytes(12).toString('hex'),
      profilePhoto: '',
      status: 'offline',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...user,
    };
    data.users.push(newUser);
    writeData(data);
    return newUser;
  },

  async updateUser(id, updates) {
    const data = readData();
    const index = data.users.findIndex((u) => u._id === id);
    if (index >= 0) {
      data.users[index] = { ...data.users[index], ...updates };
      writeData(data);
      return data.users[index];
    }
    return null;
  },

  async searchUsers(query, excludeId) {
    const data = readData();
    return data.users.filter(
      (u) =>
        u._id !== excludeId &&
        (u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()))
    );
  },

  // --- CHATS ---
  async getChats(userId) {
    const data = readData();
    
    // Filter chats where user is a member
    const userChats = data.chats.filter((c) => c.members.includes(userId));
    
    // Populate members list details and lastMessage
    const populated = userChats.map((c) => {
      const populatedMembers = c.members.map((memberId) => {
        const fullUser = data.users.find((u) => u._id === memberId);
        return fullUser ? { _id: fullUser._id, name: fullUser.name, email: fullUser.email, profilePhoto: fullUser.profilePhoto, status: fullUser.status } : { _id: memberId };
      });

      let populatedMsg = null;
      if (c.lastMessage) {
        // If lastMessage is stored as object
        const msg = typeof c.lastMessage === 'string' ? data.messages.find((m) => m._id === c.lastMessage) : c.lastMessage;
        if (msg) {
          const senderId = typeof msg.sender === 'object' ? (msg.sender._id || msg.sender) : msg.sender;
          const senderInfo = data.users.find((u) => u._id === senderId);
          populatedMsg = {
            ...msg,
            sender: senderInfo ? { _id: senderInfo._id, name: senderInfo.name } : { _id: senderId },
          };
        }
      }

      return {
        ...c,
        members: populatedMembers,
        lastMessage: populatedMsg,
      };
    });

    // Sort by last message timestamp or creation timestamp
    return populated.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.createdAt);
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.createdAt);
      return timeB - timeA;
    });
  },

  async getChatById(chatId) {
    const data = readData();
    const chat = data.chats.find((c) => c._id === chatId);
    if (!chat) return null;

    const populatedMembers = chat.members.map((memberId) => {
      const fullUser = data.users.find((u) => u._id === memberId);
      return fullUser ? { _id: fullUser._id, name: fullUser.name, email: fullUser.email, profilePhoto: fullUser.profilePhoto, status: fullUser.status, lastSeen: fullUser.lastSeen } : { _id: memberId };
    });

    return {
      ...chat,
      members: populatedMembers,
    };
  },

  async findPrivateChat(userA, userB) {
    const data = readData();
    return data.chats.find(
      (c) =>
        !c.isGroupChat &&
        c.members.includes(userA) &&
        c.members.includes(userB)
    );
  },

  async createChat(isGroupChat, members, chatName = '', groupAdmin = null) {
    const data = readData();
    const newChat = {
      _id: crypto.randomBytes(12).toString('hex'),
      isGroupChat,
      chatName: isGroupChat ? chatName : '',
      members,
      groupAdmin: isGroupChat ? groupAdmin : null,
      lastMessage: null,
      createdAt: new Date().toISOString(),
    };
    data.chats.push(newChat);
    writeData(data);
    return newChat;
  },

  async updateChat(chatId, updates) {
    const data = readData();
    const index = data.chats.findIndex((c) => c._id === chatId);
    if (index >= 0) {
      data.chats[index] = { ...data.chats[index], ...updates };
      writeData(data);
      return data.chats[index];
    }
    return null;
  },

  // --- MESSAGES ---
  async getMessages(chatId) {
    const data = readData();
    const chatMsgs = data.messages.filter((m) => m.chat === chatId);
    
    // Populate sender details
    return chatMsgs.map((m) => {
      const senderInfo = data.users.find((u) => u._id === m.sender);
      return {
        ...m,
        sender: senderInfo
          ? { _id: senderInfo._id, name: senderInfo.name, profilePhoto: senderInfo.profilePhoto }
          : { _id: m.sender },
      };
    });
  },

  async getMessageById(messageId) {
    const data = readData();
    return data.messages.find((m) => m._id === messageId);
  },

  async createMessage(senderId, chatId, content, messageType = 'text', fileUrl = '') {
    const data = readData();
    const newMessage = {
      _id: crypto.randomBytes(12).toString('hex'),
      sender: senderId,
      content,
      chat: chatId,
      messageType,
      fileUrl,
      seenBy: [senderId],
      createdAt: new Date().toISOString(),
    };
    
    data.messages.push(newMessage);

    // Update last message in Chat
    const chatIndex = data.chats.findIndex((c) => c._id === chatId);
    if (chatIndex >= 0) {
      data.chats[chatIndex].lastMessage = newMessage;
    }

    writeData(data);

    // Populate sender details before returning
    const senderInfo = data.users.find((u) => u._id === senderId);
    return {
      ...newMessage,
      sender: senderInfo
        ? { _id: senderInfo._id, name: senderInfo.name, profilePhoto: senderInfo.profilePhoto }
        : { _id: senderId },
    };
  },

  async updateMessage(messageId, updates) {
    const data = readData();
    const index = data.messages.findIndex((m) => m._id === messageId);
    if (index >= 0) {
      data.messages[index] = { ...data.messages[index], ...updates, edited: true };
      
      // Update last message if this is the active last message of the chat
      const chatId = data.messages[index].chat;
      const chatIndex = data.chats.findIndex((c) => c._id === chatId);
      if (chatIndex >= 0 && data.chats[chatIndex].lastMessage?._id === messageId) {
        data.chats[chatIndex].lastMessage = data.messages[index];
      }

      writeData(data);
      return data.messages[index];
    }
    return null;
  },

  async deleteMessage(messageId) {
    const data = readData();
    const index = data.messages.findIndex((m) => m._id === messageId);
    if (index >= 0) {
      // Keep message slot but flag deleted
      data.messages[index].deleted = true;
      data.messages[index].content = 'This message was deleted';
      data.messages[index].fileUrl = '';

      // Update last message if this was the last message of the chat
      const chatId = data.messages[index].chat;
      const chatIndex = data.chats.findIndex((c) => c._id === chatId);
      if (chatIndex >= 0 && data.chats[chatIndex].lastMessage?._id === messageId) {
        data.chats[chatIndex].lastMessage = data.messages[index];
      }

      writeData(data);
      return data.messages[index];
    }
    return null;
  },
};
