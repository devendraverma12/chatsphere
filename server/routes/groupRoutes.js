import express from 'express';
import Chat from '../models/Chat.js';
import { dbService } from '../services/dbService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// @desc    Create a new group chat
// @route   POST /api/groups/create
// @access  Private
router.post('/create', async (req, res) => {
  const { users, chatName } = req.body;

  if (!users || !chatName) {
    return res.status(400).json({ message: 'Users list and group name are required' });
  }

  // Parse users array if sent as string
  let parsedUsers = typeof users === 'string' ? JSON.parse(users) : users;

  if (parsedUsers.length < 2) {
    return res.status(400).json({ message: 'Group chats require at least 2 other members' });
  }

  // Add the creator to group
  parsedUsers.push(req.user._id);

  try {
    if (global.useMockDB) {
      const groupChat = await dbService.createChat(true, parsedUsers, chatName, req.user._id);
      const populated = await dbService.getChatById(groupChat._id);
      return res.status(251).json(populated);
    }

    const groupChat = await Chat.create({
      chatName,
      isGroupChat: true,
      members: parsedUsers,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('members', 'name email profilePhoto status')
      .populate('groupAdmin', 'name email');

    res.status(201).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add member to group chat
// @route   PUT /api/groups/add
// @access  Private
router.put('/add', async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    let chat;
    if (global.useMockDB) {
      chat = await dbService.getChatById(chatId);
    } else {
      chat = await Chat.findById(chatId);
    }

    if (!chat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    // Verify admin
    const adminId = chat.groupAdmin?._id || chat.groupAdmin;
    if (adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group administrators can add members' });
    }

    // Check if already in group
    const membersList = chat.members.map((m) => m._id || m);
    if (membersList.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    let updatedChat;
    if (global.useMockDB) {
      const freshMembers = [...chat.members.map(m => m._id), userId];
      await dbService.updateChat(chatId, { members: freshMembers });
      updatedChat = await dbService.getChatById(chatId);
    } else {
      updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { $push: { members: userId } },
        { new: true }
      )
        .populate('members', 'name email profilePhoto status')
        .populate('groupAdmin', 'name email');
    }

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Remove member from group chat
// @route   PUT /api/groups/remove
// @access  Private
router.put('/remove', async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    let chat;
    if (global.useMockDB) {
      chat = await dbService.getChatById(chatId);
    } else {
      chat = await Chat.findById(chatId);
    }

    if (!chat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    // Verify admin OR self-removal (leave group)
    const adminId = chat.groupAdmin?._id || chat.groupAdmin;
    const isSelf = userId.toString() === req.user._id.toString();

    if (adminId.toString() !== req.user._id.toString() && !isSelf) {
      return res.status(403).json({ message: 'Only group administrators can remove members' });
    }

    let updatedChat;
    if (global.useMockDB) {
      const freshMembers = chat.members.map(m => m._id).filter((id) => id !== userId);
      await dbService.updateChat(chatId, { members: freshMembers });
      updatedChat = await dbService.getChatById(chatId);
    } else {
      updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { $pull: { members: userId } },
        { new: true }
      )
        .populate('members', 'name email profilePhoto status')
        .populate('groupAdmin', 'name email');
    }

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Rename group chat
// @route   PUT /api/groups/rename
// @access  Private
router.put('/rename', async (req, res) => {
  const { chatId, chatName } = req.body;

  if (!chatName) {
    return res.status(400).json({ message: 'New group name is required' });
  }

  try {
    let chat;
    if (global.useMockDB) {
      chat = await dbService.getChatById(chatId);
    } else {
      chat = await Chat.findById(chatId);
    }

    if (!chat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    // Verify user is in group
    const membersList = chat.members.map((m) => m._id || m);
    if (!membersList.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Only members can rename the group' });
    }

    let updatedChat;
    if (global.useMockDB) {
      await dbService.updateChat(chatId, { chatName });
      updatedChat = await dbService.getChatById(chatId);
    } else {
      updatedChat = await Chat.findByIdAndUpdate(chatId, { chatName }, { new: true })
        .populate('members', 'name email profilePhoto status')
        .populate('groupAdmin', 'name email');
    }

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
