import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { dbService } from '../services/dbService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware
router.use(protect);

// @desc    Get all chats for user
// @route   GET /api/chats
// @access  Private
router.get('/', async (req, res) => {
  try {
    if (global.useMockDB) {
      const chats = await dbService.getChats(req.user._id);
      return res.json(chats);
    }

    const chats = await Chat.find({ members: { $elemMatch: { $eq: req.user._id } } })
      .populate('members', 'name email profilePhoto status')
      .populate('groupAdmin', 'name email')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name email profilePhoto',
        },
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Access or create a 1-to-1 chat
// @route   POST /api/chats
// @access  Private
router.post('/', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'UserId param is required' });
  }

  try {
    if (global.useMockDB) {
      // Find existing chat
      const existingChat = await dbService.findPrivateChat(req.user._id, userId);
      if (existingChat) {
        const populated = await dbService.getChatById(existingChat._id);
        return res.json(populated);
      }

      // Create new chat
      const newChat = await dbService.createChat(false, [req.user._id, userId]);
      const populated = await dbService.getChatById(newChat._id);
      return res.status(201).json(populated);
    }

    // MongoDB mode
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { members: { $elemMatch: { $eq: req.user._id } } },
        { members: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('members', 'name email profilePhoto status')
      .populate('lastMessage');

    if (isChat.length > 0) {
      res.json(isChat[0]);
    } else {
      const chatData = {
        chatName: 'sender',
        isGroupChat: false,
        members: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findById(createdChat._id).populate(
        'members',
        'name email profilePhoto status'
      );
      res.status(201).json(fullChat);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all messages for a chat & update read receipts
// @route   GET /api/chats/:chatId/messages
// @access  Private
router.get('/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;

  try {
    if (global.useMockDB) {
      // Update read receipts: add user to seenBy if not already present
      const messages = await dbService.getMessages(chatId);
      for (const msg of messages) {
        if (!msg.seenBy.includes(req.user._id)) {
          msg.seenBy.push(req.user._id);
          await dbService.updateMessage(msg._id, { seenBy: msg.seenBy });
        }
      }
      const freshMessages = await dbService.getMessages(chatId);
      return res.json(freshMessages);
    }

    // MongoDB mode: mark as seen
    await Message.updateMany(
      { chat: chatId, seenBy: { $ne: req.user._id } },
      { $addToSet: { seenBy: req.user._id } }
    );

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name email profilePhoto status')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send a new message
// @route   POST /api/chats/messages
// @access  Private
router.post('/messages', async (req, res) => {
  const { chatId, content, messageType, fileUrl } = req.body;

  if (!content && !fileUrl) {
    return res.status(400).json({ message: 'Message content or file attachment is required' });
  }

  try {
    if (global.useMockDB) {
      const msg = await dbService.createMessage(
        req.user._id,
        chatId,
        content,
        messageType || 'text',
        fileUrl || ''
      );
      
      // Update chat lastMessage and timestamp
      await dbService.updateChat(chatId, { lastMessage: msg });

      return res.status(201).json(msg);
    }

    // MongoDB Mode
    const newMessage = {
      sender: req.user._id,
      content,
      chat: chatId,
      messageType: messageType || 'text',
      fileUrl: fileUrl || '',
      seenBy: [req.user._id],
    };

    let message = await Message.create(newMessage);
    message = await message.populate('sender', 'name profilePhoto');
    message = await message.populate({
      path: 'chat',
      populate: {
        path: 'members',
        select: 'name email profilePhoto',
      },
    });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Edit a message
// @route   PUT /api/chats/messages/:messageId
// @access  Private
router.put('/messages/:messageId', async (req, res) => {
  const { content } = req.body;

  try {
    let msg;
    if (global.useMockDB) {
      msg = await dbService.getMessageById(req.params.messageId);
    } else {
      msg = await Message.findById(req.params.messageId);
    }

    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify ownership
    const senderId = msg.sender?._id || msg.sender;
    if (senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    let updatedMsg;
    if (global.useMockDB) {
      updatedMsg = await dbService.updateMessage(req.params.messageId, { content });
      const sender = await dbService.getUserById(updatedMsg.sender);
      updatedMsg.sender = { _id: sender._id, name: sender.name, profilePhoto: sender.profilePhoto };
    } else {
      msg.content = content;
      await msg.save();
      updatedMsg = await msg.populate('sender', 'name profilePhoto');
    }

    res.json(updatedMsg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a message (soft delete)
// @route   DELETE /api/chats/messages/:messageId
// @access  Private
router.delete('/messages/:messageId', async (req, res) => {
  try {
    let msg;
    if (global.useMockDB) {
      msg = await dbService.getMessageById(req.params.messageId);
    } else {
      msg = await Message.findById(req.params.messageId);
    }

    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify ownership
    const senderId = msg.sender?._id || msg.sender;
    if (senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    let deletedMsg;
    if (global.useMockDB) {
      deletedMsg = await dbService.deleteMessage(req.params.messageId);
      const sender = await dbService.getUserById(deletedMsg.sender);
      deletedMsg.sender = { _id: sender._id, name: sender.name, profilePhoto: sender.profilePhoto };
    } else {
      msg.deleted = true;
      msg.content = 'This message was deleted';
      msg.fileUrl = '';
      await msg.save();
      deletedMsg = await msg.populate('sender', 'name profilePhoto');
    }

    res.json(deletedMsg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
