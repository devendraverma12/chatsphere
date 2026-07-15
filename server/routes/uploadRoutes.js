import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ensure local uploads directory exists
const __dirname = path.resolve();
const uploadDir = path.join(__dirname, '/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
});

// @desc    Upload file or image attachment
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Check if Cloudinary is configured
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'chatsphere',
        resource_type: 'auto',
      });

      // Remove local temporary file
      fs.unlinkSync(req.file.path);

      return res.json({ url: result.secure_url });
    } catch (error) {
      console.error('Cloudinary upload failed, using local storage fallback:', error);
      const localUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      return res.json({ url: localUrl });
    }
  } else {
    const localUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    return res.json({ url: localUrl });
  }
});

export default router;
