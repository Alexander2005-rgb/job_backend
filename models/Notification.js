import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['application_update', 'new_application'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Additional data for specific notification types
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true // e.g., applicationId or jobId
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // Store additional data like jobTitle, employerName, etc.
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
