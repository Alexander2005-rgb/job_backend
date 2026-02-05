/* import express framework for building the web application */
import dotenv from 'dotenv';

//load environment variable
dotenv.config();

import express from 'express'
//http request logger middleware
import morgan from 'morgan'
// providing a connect/express middleware that can be used to enable cross-origin resource sharing
import cors from 'cors'
// database connection module
import mongoose from 'mongoose'
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './models/User.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = await User.findOne({ email: profile.emails[0].value });

    if (!user) {
      // Create new user as jobseeker
      user = new User({
        email: profile.emails[0].value,
        password: 'google-oauth', // Placeholder password
        role: 'jobseeker'
      });
      await user.save();
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

import authRouter from './routes/auth.js'

//create an express application instances
const app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// define the port to run the server on
const port = process.env.PORT;

// Routes
app.use('/api/auth', authRouter);
import jobRouter from './routes/jobs.js';
import applicationRouter from './routes/applications.js';
import profileRouter from './routes/profile.js';
import notificationRouter from './routes/notifications.js';

app.use('/api/jobs', jobRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/profile', profileRouter);
app.use('/api/notifications', notificationRouter);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
     res.json({ message: "Get Request" });
});

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database connection function
mongoose.connect(process.env.MONGO_URI)
.then(() => {
     server.listen(port, () =>{
     console.log(`server is running on port ${port} & connected to database`);
     });

}).catch((error) => {
     console.log("Database connection failed",error);
})
