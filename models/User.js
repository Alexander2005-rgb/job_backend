import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['jobseeker', 'employer'],
    required: true
  },
  // Profile fields
  name: {
    type: String,
    trim: true
  },
  resume: {
    type: String, // URL or path to resume file
  },
  company: {
    type: String,
    trim: true
  },
  companyDescription: {
    type: String,
    trim: true
  },
  // Contact details
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  photo: {
    type: String, // URL or path to photo file
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
