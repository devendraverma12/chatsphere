import { dbService } from '../services/dbService.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import mongoose from 'mongoose';


// Bot Response Dialog Database
const BOT_RESPONSES = {
  alice: [
    "Hey! I'm Alice, a simulated real-time chatbot on ChatSphere. I can see your message and write back instantly! Type 'features' or 'stack' to see what else I can share.",
    "ChatSphere is running in Local Database Fallback mode! This means all actions persist to a local file, so you can test registration and group chats instantly.",
    "Did you know ChatSphere supports dark mode, typing indicators, Seen receipts, and message editing/deleting? Try hovering over your messages in our chat!",
    "That sounds interesting! Tell me more about what you're building on ChatSphere.",
    "Real-time communication is powered by WebSockets via Socket.io. You can test it by logging in as Alice or Bob in another browser window!",
  ],
  bob: [
    "Hello! I am Bob, your ChatSphere Support Assistant. How can I help you test the messaging interface today?",
    "If you want to test group chatting: click 'New Group' in the sidebar, name the group, select 'Alice' and 'Bob', and send a message. We will both be added!",
    "ChatSphere stack uses: React + Tailwind CSS on the frontend, and Node.js + Express.js + Socket.io on the backend. It's clean, modern, and fast.",
    "Feel free to test sending images or files using the paperclip button in the chat footer. They will save locally to server/uploads/ folder.",
    "To review analytics and user logs, make sure to inspect settings or start another chat thread. Let me know if you run into any issues!",
  ]
};

const getBotReply = (botName, userMessage) => {
  const msg = userMessage.toLowerCase();
  const responses = BOT_RESPONSES[botName];

  if (msg.includes('feature')) {
    return "🚀 ChatSphere Key Features:\n1. One-to-one & Group Chats\n2. Real-Time Sockets (Socket.io)\n3. typing indicators & Seen receipts\n4. Message Edits & Deletes\n5. Image / File Attachments\n6. Emoji Picker & Message Search\n7. Light/Dark Mode";
  }
  if (msg.includes('stack') || msg.includes('tech')) {
    return "💻 ChatSphere Stack:\n- Frontend: React + Tailwind CSS v4\n- Backend: Express + Socket.io\n- Database: Mongoose (with local JSON Fallback)\n- Files: Cloudinary (local disk fallback)";
  }
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    return responses[0];
  }
  
  // Pick random fallback response
  const randIndex = Math.floor(Math.random() * (responses.length - 1)) + 1;
  return responses[randIndex];
};

const getAIResponse = (userMessage) => {
  const msg = userMessage.toLowerCase().trim();

  if (msg === 'help' || msg === 'hello' || msg === 'hi' || msg === 'hey') {
    return "🤖 Hello! I am your ChatSphere AI Assistant. How can I help you today? Here is a list of commands you can test:\n\n" +
           "• `calc [expression]` - Evaluate math (e.g. 'calc (25 + 5) * 4')\n" +
           "• `translate [text]` - Translate text to Spanish & French\n" +
           "• `joke` - Hear a clean software developer joke\n" +
           "• `quote` - Get an inspiring programming quote\n" +
           "• `time` - Display the current server date and time\n" +
           "• Or simply ask me any general question!";
  }

  if (msg.includes('joke')) {
    const jokes = [
      "Why do programmers wear glasses? Because they can't C#!",
      "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
      "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
      "['hip', 'hip'] (hip hip array!)",
      "There are 10 types of people in the world: those who understand binary, and those who don't."
    ];
    return "😄 Here is a joke for you:\n\n" + jokes[Math.floor(Math.random() * jokes.length)];
  }

  if (msg.startsWith('calc ')) {
    const expression = userMessage.substring(5).trim();
    try {
      if (/^[0-9+\-*/().\s]+$/.test(expression)) {
        const result = Function(`"use strict"; return (${expression})`)();
        return `📊 Math Calculation:\n\n➔ ${expression} = ${result}`;
      } else {
        return "❌ Safety Alert: I can only evaluate expressions containing numbers and basic operators (+, -, *, /, (, )).";
      }
    } catch (e) {
      return "❌ Error: Invalid mathematical formula. Example: 'calc 10 * (5 + 2)'";
    }
  }

  if (msg.startsWith('translate ')) {
    const phrase = userMessage.substring(10).trim();
    return `🌎 Spanish Translation:\n"${phrase}" ➔ "${phrase} (en español, ¡ole!)"\n\n🌎 French Translation:\n"${phrase}" ➔ "${phrase} (en français, voilà!)"`;
  }

  if (msg.includes('time') || msg.includes('date')) {
    return `📅 Server Clock:\n➔ Current date/time is ${new Date().toLocaleString()}`;
  }

  if (msg.includes('quote') || msg.includes('motivate')) {
    const quotes = [
      "\"Talk is cheap. Show me the code.\" — Linus Torvalds",
      "\"Programs must be written for people to read, and only incidentally for machines to execute.\" — Harold Abelson",
      "\"First, solve the problem. Then, write the code.\" — John Johnson",
      "\"Experience is the name everyone gives to their mistakes.\" — Oscar Wilde",
      "\"Before software can be reusable it first has to be usable.\" — Ralph Johnson"
    ];
    return "💡 Inspirational Quote:\n\n" + quotes[Math.floor(Math.random() * quotes.length)];
  }

  return `🤖 I processed your query: "${userMessage}".\n\nI am configured locally on this ChatSphere instance. Type 'help' to see my advanced math calculation, translating, and entertainment commands!`;
};


export const initSocket = (io) => {
  // Tracking online users: userId -> socketId
  const onlineUsers = new Map();
  const matchmakingQueue = [];


  io.on('connection', (socket) => {
    console.log('⚡ Client connected to Socket.io:', socket.id);

    // 1. Setup user room and mark online
    socket.on('setup', async (userData) => {
      if (!userData || !userData._id) return;
      
      socket.join(userData._id);
      onlineUsers.set(userData._id, socket.id);
      
      // Update online status in database
      if (global.useMockDB) {
        await dbService.updateUser(userData._id, { status: 'online' });
      } else {
        try {
          await mongoose.model('User').findByIdAndUpdate(userData._id, { status: 'online' });
        } catch (e) {}
      }

      // Broadcast user is online
      socket.broadcast.emit('user_online', userData._id);
      socket.emit('connected');
      console.log(`User ${userData.name} (${userData._id}) is online.`);
    });

    // 2. Join a specific chat room
    socket.on('join_chat', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined chat room: ${room}`);
    });

    // 3. Handle message typing events
    socket.on('typing', (room) => socket.in(room).emit('typing', room));
    socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing', room));

    // 4. Handle sending a message
    socket.on('new_message', async (messageReceived) => {
      console.log('📨 Server received new_message event:', JSON.stringify(messageReceived));
      const chat = messageReceived.chat;
      if (!chat) {
        console.warn('⚠️ No chat property found in new_message payload!');
        return;
      }

      const chatId = typeof chat === 'string' ? chat : chat._id;
      const senderId = messageReceived.sender?._id || messageReceived.sender;
      console.log(`💬 Message metadata: chatId=${chatId}, senderId=${senderId}`);

      // Broadcast message to everyone in the room except sender
      socket.in(chatId).emit('message_received', messageReceived);

      // --- CHATBOT & AI AUTOMATION SECTION ---
      // Check if this chat is a 1-to-1 conversation containing a chatbot or AI Bot
      let fullChat;
      if (global.useMockDB) {
        fullChat = await dbService.getChatById(chatId);
      } else {
        try {
          fullChat = await Chat.findById(chatId).populate('members', '_id name');
        } catch (e) {}
      }

      if (fullChat && !fullChat.isGroupChat) {
        const membersList = fullChat.members;
        console.log('👥 Chat members list:', JSON.stringify(membersList));
        const botMember = membersList.find(
          (m) => m._id === 'alice_bot_id_123' || m._id === 'bob_bot_id_456' || m._id === 'ai_bot_id_999' || m._id?.toString() === '64ae99999999999999999999'
        );
        console.log('🤖 Matched botMember profile:', JSON.stringify(botMember));

        if (botMember && senderId !== botMember._id?.toString()) {
          const isAI = botMember._id === 'ai_bot_id_999' || botMember._id?.toString() === '64ae99999999999999999999';
          const botName = isAI ? 'ai' : (botMember._id === 'alice_bot_id_123' ? 'alice' : 'bob');
          const replyText = isAI ? getAIResponse(messageReceived.content) : getBotReply(botName, messageReceived.content);

          console.log(`🤖 Chatbot trigger active for ${botName} in chat ${chatId}`);

          // 1. Simulate seen status after 300ms
          setTimeout(() => {
            io.in(chatId).emit('message_seen', {
              chatId,
              userId: botMember._id,
              messageId: messageReceived._id
            });
          }, 300);

          // 2. Trigger bot typing indicator after 800ms
          setTimeout(() => {
            io.in(chatId).emit('typing', chatId);
          }, 850);

          // 3. Create and send bot reply message after 2200ms
          setTimeout(async () => {
            // Stop typing status
            io.in(chatId).emit('stop_typing', chatId);

            let botMessage;
            if (global.useMockDB) {
              botMessage = await dbService.createMessage(botMember._id, chatId, replyText);
            } else {
              try {
                const newMsg = {
                  sender: botMember._id,
                  content: replyText,
                  chat: chatId,
                  seenBy: [botMember._id],
                };
                let created = await Message.create(newMsg);
                botMessage = await created.populate('sender', 'name profilePhoto');
                await Chat.findByIdAndUpdate(chatId, { lastMessage: botMessage });
              } catch (e) {}
            }

            if (botMessage) {
              io.in(chatId).emit('message_received', botMessage);
            }
          }, 2300);
        }
      }
    });

    // 5. Handle Seen/Read receipts updates
    socket.on('seen_message', ({ chatId, userId, messageId }) => {
      socket.in(chatId).emit('message_seen', { chatId, userId, messageId });
    });

    // Matchmaking events
    socket.on('join_random_queue', async (userId) => {
      console.log(`👤 User ${userId} joined random matchmaking queue.`);
      
      // Clean up queue of offline or invalid users first
      const activeQueue = matchmakingQueue.filter(id => onlineUsers.has(id) && id !== userId);
      
      if (activeQueue.length > 0) {
        // We have a match!
        const peerId = activeQueue.shift();
        const idx = matchmakingQueue.indexOf(peerId);
        if (idx > -1) matchmakingQueue.splice(idx, 1);
        
        let chat;
        if (global.useMockDB) {
          chat = await dbService.createChat(false, [userId, peerId], 'Random Stranger');
          chat = await dbService.getChatById(chat._id);
        } else {
          try {
            const created = await Chat.create({
              isGroupChat: false,
              chatName: 'Random Stranger',
              members: [userId, peerId]
            });
            chat = await Chat.findById(created._id).populate('members', 'name email profilePhoto status');
          } catch (e) {
            console.error(e);
          }
        }
        
        io.to(userId).emit('random_matched', chat);
        io.to(peerId).emit('random_matched', chat);
        console.log(`🎉 Random Match created between ${userId} and ${peerId}`);
      } else {
        // Add to queue if not present
        if (!matchmakingQueue.includes(userId)) {
          matchmakingQueue.push(userId);
        }
        
        // Wait 3.5 seconds before fallback bot matching
        setTimeout(async () => {
          const checkIdx = matchmakingQueue.indexOf(userId);
          if (checkIdx > -1) {
            matchmakingQueue.splice(checkIdx, 1);
            
            const botId = Math.random() > 0.5 ? 'alice_bot_id_123' : 'bob_bot_id_456';
            const botProfile = await dbService.getUserById(botId);
            
            let chat;
            if (global.useMockDB) {
              chat = await dbService.createChat(false, [userId, botId], 'Random Stranger');
              chat = await dbService.getChatById(chat._id);
              
              const botMessage = await dbService.createMessage(botId, chat._id, `Hey there! I am a Random Stranger (${botProfile?.name || 'Alice'}). Let's chat! Type 'features' to learn my triggers.`);
              chat.lastMessage = botMessage;
              await dbService.updateChat(chat._id, { lastMessage: botMessage });
            } else {
              try {
                const created = await Chat.create({
                  isGroupChat: false,
                  chatName: 'Random Stranger',
                  members: [userId, botId]
                });
                chat = await Chat.findById(created._id).populate('members', 'name email profilePhoto status');
              } catch (e) {}
            }
            
            io.to(userId).emit('random_matched', chat);
            console.log(`🤖 Fallback bot ${botId} matched with waiting user ${userId}`);
          }
        }, 3500);
      }
    });

    socket.on('leave_random_queue', (userId) => {
      const idx = matchmakingQueue.indexOf(userId);
      if (idx > -1) {
        matchmakingQueue.splice(idx, 1);
        console.log(`👤 User ${userId} left matchmaking queue.`);
      }
    });

    // 6. Handle Disconnect / Offline indicators
    socket.on('disconnect', async () => {
      console.log('⚡ Client disconnected from Socket.io:', socket.id);
      
      // Find user matching socket ID
      let disconnectedUserId = null;
      for (const [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }

      if (disconnectedUserId) {
        onlineUsers.delete(disconnectedUserId);

        // Update database state
        if (global.useMockDB) {
          await dbService.updateUser(disconnectedUserId, { status: 'offline', lastSeen: new Date().toISOString() });
        } else {
          try {
            await mongoose.model('User').findByIdAndUpdate(disconnectedUserId, {
              status: 'offline',
              lastSeen: new Date(),
            });
          } catch (e) {}
        }

        // Broadcast offline status
        socket.broadcast.emit('user_offline', disconnectedUserId);
        console.log(`User ${disconnectedUserId} went offline.`);
      }
    });
  });
};
