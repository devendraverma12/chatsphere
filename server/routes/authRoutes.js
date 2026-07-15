import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { dbService } from '../services/dbService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'chatspheresecretkey12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, profilePhoto } = req.body;

  try {
    let userExists;

    if (global.useMockDB) {
      userExists = await dbService.getUserByEmail(email);
    } else {
      userExists = await User.findOne({ email });
    }

    if (userExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    let user;

    if (global.useMockDB) {
      // Hash password manually for mock DB
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await dbService.createUser({
        name,
        email,
        password: hashedPassword,
        profilePhoto: profilePhoto || '',
      });
    } else {
      user = await User.create({
        name,
        email,
        password,
        profilePhoto: profilePhoto || '',
      });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user;

    if (global.useMockDB) {
      user = await dbService.getUserByEmail(email);
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Match password
    let isMatch = false;
    if (global.useMockDB) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = await user.matchPassword(password);
    }

    if (isMatch) {
      // Set status online on login
      if (global.useMockDB) {
        await dbService.updateUser(user._id, { status: 'online' });
      } else {
        user.status = 'online';
        await user.save();
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Logout user & update status
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    if (global.useMockDB) {
      await dbService.updateUser(req.user._id, { status: 'offline', lastSeen: new Date().toISOString() });
    } else {
      const user = await User.findById(req.user._id);
      if (user) {
        user.status = 'offline';
        user.lastSeen = new Date();
        await user.save();
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  const { name, profilePhoto, password } = req.body;

  try {
    let updatedUser;

    if (global.useMockDB) {
      const updates = { name, profilePhoto };
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(password, salt);
      }
      updatedUser = await dbService.updateUser(req.user._id, updates);
    } else {
      const user = await User.findById(req.user._id);
      if (user) {
        user.name = name || user.name;
        user.profilePhoto = profilePhoto || user.profilePhoto;
        if (password) {
          user.password = password;
        }
        updatedUser = await user.save();
      }
    }

    if (updatedUser) {
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePhoto: updatedUser.profilePhoto,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Search for users to start chats
// @route   GET /api/auth/users?search=keyword
// @access  Private
router.get('/users', protect, async (req, res) => {
  const searchKeyword = req.query.search || '';

  try {
    let users;

    if (global.useMockDB) {
      users = await dbService.searchUsers(searchKeyword, req.user._id);
    } else {
      const query = {
        _id: { $ne: req.user._id },
        $or: [
          { name: { $regex: searchKeyword, $options: 'i' } },
          { email: { $regex: searchKeyword, $options: 'i' } },
        ],
      };
      users = await User.find(query).select('name email profilePhoto status');
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
