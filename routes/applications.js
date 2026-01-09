import express from 'express';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply for a job (jobseekers only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Only job seekers can apply for jobs' });
    }

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({ jobId, userId: req.user.userId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = new Application({
      jobId,
      userId: req.user.userId
    });

    await application.save();

    // Notification will be handled via database polling or other means
    // Real-time notifications removed for Vercel compatibility

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get applications for employer's jobs (employers only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Only employers can view applications' });
    }

    const applications = await Application.find({ status: { $ne: 'rejected' } })
      .populate('jobId', 'title company employerId')
      .populate('userId', 'name email phone address linkedin resume')
      .sort({ appliedAt: -1 });

    // Filter to only include applications for employer's jobs
    const employerApplications = applications.filter(app =>
      app.jobId && app.jobId.employerId.toString() === req.user.userId
    );

    res.json(employerApplications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's own applications (jobseekers only)
router.get('/my-applications', auth, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Only job seekers can view their applications' });
    }

    const applications = await Application.find({ userId: req.user.userId })
      .populate('jobId', 'title company location type salary')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update application status (employers only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Only employers can update applications' });
    }

    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id).populate('jobId').populate('userId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.jobId.employerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only update applications for your jobs' });
    }

    const oldStatus = application.status;
    application.status = status;
    await application.save();

    // Create persistent notification for the job seeker
    const notification = new Notification({
      userId: application.userId._id,
      type: 'application_update',
      message: `Your application for "${application.jobId.title}" has been ${status} by ${req.user.name || req.user.email}`,
      relatedId: application._id,
      metadata: {
        jobTitle: application.jobId.title,
        status: status,
        oldStatus: oldStatus,
        employerName: req.user.name || req.user.email,
        updatedAt: new Date()
      }
    });
    await notification.save();

    // Real-time notification removed for Vercel compatibility
    // Notifications will be polled from the database

    res.json(application);
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
