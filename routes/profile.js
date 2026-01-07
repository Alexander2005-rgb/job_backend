import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/', auth, upload.any(), async (req, res) => {
  try {
    const updates = req.body;

    // Role-based allowed updates
    let allowedUpdates = [];
    if (req.user.role === 'jobseeker') {
      allowedUpdates = ['name', 'resume', 'photo', 'phone', 'address', 'linkedin'];
    } else if (req.user.role === 'employer') {
      allowedUpdates = ['name', 'company', 'companyDescription', 'photo', 'phone', 'address', 'linkedin'];
    }

    // Filter out invalid fields
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Handle file uploads
    req.files.forEach(file => {
      if (file.fieldname === 'photo' && allowedUpdates.includes('photo')) {
        filteredUpdates.photo = file.filename;
      }
      if (file.fieldname === 'resume' && allowedUpdates.includes('resume')) {
        filteredUpdates.resume = file.filename;
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Max size is 5MB.' });
      }
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
