import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory (project root)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'VITE_GOOGLE_OAUTH_CLIENT_ID'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_OAUTH_CLIENT_ID);

app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('✅ Connected to MongoDB successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  password: { type: String, required: true },
  googleId: { type: String }, // Optional Google ID for OAuth users
  avatar: { type: String }, // Optional avatar URL from Google
  createdAt: { type: Date, default: Date.now },
  
  // Progressive Trust Ladder fields
  readinessScore: { type: Number, default: 0, min: 0, max: 100 },
  communityReadyDate: { type: Date },
  currentPhase: { 
    type: String, 
    enum: ['ai-only', 'micro-therapy', 'community-readonly', 'full-access'],
    default: 'ai-only'
  },
  sessionCount: { type: Number, default: 0 },
  lastSessionDate: { type: Date },
  moodStabilityScore: { type: Number, default: 0 }, // Variance measure
  therapyAdoptionCount: { type: Number, default: 0 },
  engagementDays: { type: Number, default: 0 },
  
  // Guardian consent (for minors)
  isMinor: { type: Boolean, default: false },
  guardianEmail: { type: String },
  guardianConsent: { type: Boolean, default: false },
  guardianConsentDate: { type: Date },
  
  // Reputation & Safety
  reputationScore: { type: Number, default: 50, min: 0, max: 100 },
  toxicityFlags: { type: Number, default: 0 },
  warningCount: { type: Number, default: 0 },
  isShadowBanned: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

// Recommendation Schema
const recommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sport: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  maxParticipants: { type: Number, required: true },
  currentParticipants: { type: Number, default: 0 },
  location: { type: String, required: true },
  status: { type: String, enum: ['open', 'full', 'cancelled'], default: 'open' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// Event Participant Schema
const eventParticipantSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const EventParticipant = mongoose.model('EventParticipant', eventParticipantSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  type: { type: String, enum: ['join_request', 'request_accepted', 'request_rejected'], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Flagged Content Schema (for toxicity moderation)
const flaggedContentSchema = new mongoose.Schema({
  contentType: { type: String, enum: ['message', 'recommendation', 'event', 'comment'], required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  toxicityScore: { type: Number, default: 0, min: 0, max: 1 }, // 0-1 from classifier
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'removed', 'false_positive'],
    default: 'pending'
  },
  moderatorAction: { type: String },
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  flaggedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date }
});

const FlaggedContent = mongoose.model('FlaggedContent', flaggedContentSchema);

// Authentication Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ JWT verified successfully")
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, city, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const user = new User({ username, email, city, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt received:', { email: req.body.email });
    const { email, password } = req.body;
    
    // Admin account check (hardcoded for demo purposes)
    if (email === 'admin@pulsemind.com' && password === 'PulseMindAdmin2025!') {
      // Check if admin user exists, if not create it
      let adminUser = await User.findOne({ email: 'admin@pulsemind.com' });
      
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash('PulseMindAdmin2025!', 8);
        adminUser = new User({
          username: 'PulseMind Admin',
          email: 'admin@pulsemind.com',
          city: 'Demo',
          password: hashedPassword,
          // Full access privileges
          currentPhase: 'full-access',
          readinessScore: 100,
          sessionCount: 100,
          therapyAdoptionCount: 10,
          engagementDays: 30,
          moodStabilityScore: 100,
          reputationScore: 100,
          toxicityFlags: 0,
          communityReadyDate: new Date()
        });
        await adminUser.save();
        console.log('✨ Admin account created');
      }
      
      const token = jwt.sign({ _id: adminUser._id }, process.env.JWT_SECRET);
      const userData = {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        city: adminUser.city
      };
      
      console.log('🔑 Admin login successful');
      return res.json({ user: userData, token });
    }
    
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found:', { email });
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', { isMatch });
    
    if (!isMatch) {
      console.log('Invalid password for user:', { email });
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    console.log('Login successful:', { userId: user._id });
    
    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      city: user.city
    };

    res.json({ user: userData, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Failed to login' });
  }
});

// Google OAuth Route
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }
    
    const { email, name, picture, sub: googleId } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      user = new User({
        username: name || 'Google User',
        email: email,
        city: 'Not specified', // Default city for Google users
        password: await bcrypt.hash(googleId, 8), // Use Google ID as password base
        googleId: googleId,
        avatar: picture
      });
      await user.save();
      console.log('New Google user created:', { email, username: name });
    } else {
      console.log('Existing user logged in via Google:', { email });
    }
    
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    
    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      city: user.city
    };
    
    res.json({ user: userData, token });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ error: 'Google authentication failed' });
  }
});

// Get Current User
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Get User Readiness Status (Protected)
app.get('/api/user/readiness', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('readinessScore currentPhase sessionCount therapyAdoptionCount moodStabilityScore communityReadyDate engagementDays');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate next milestone
    let nextMilestone = '';
    let progressToNext = 0;
    
    switch(user.currentPhase) {
      case 'ai-only':
        nextMilestone = 'Complete Sentiscope assessment';
        progressToNext = user.sessionCount >= 2 ? 100 : (user.sessionCount / 2) * 100;
        break;
      case 'micro-therapy':
        nextMilestone = 'Try 2 recommended therapies';
        progressToNext = (user.therapyAdoptionCount / 2) * 100;
        break;
      case 'community-readonly':
        nextMilestone = 'Reach 70% readiness score';
        progressToNext = (user.readinessScore / 70) * 100;
        break;
      case 'full-access':
        nextMilestone = 'Maintain positive reputation';
        progressToNext = 100;
        break;
    }
    
    res.json({
      ...user.toObject(),
      nextMilestone,
      progressToNext: Math.min(progressToNext, 100)
    });
  } catch (error) {
    console.error('Error fetching readiness:', error);
    res.status(500).json({ error: 'Failed to fetch readiness' });
  }
});

// Track User Engagement (Protected)
app.post('/api/user/track-engagement', auth, async (req, res) => {
  try {
    const { action, data } = req.body; // action: 'session', 'therapy_adoption', 'assessment_complete'
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Skip tracking for admin account - maintain full access
    if (user.email === 'admin@pulsemind.com') {
      return res.json({ 
        readinessScore: 100, 
        currentPhase: 'full-access',
        message: 'Admin account - full access maintained'
      });
    }
    
    // Update engagement metrics
    const today = new Date().toDateString();
    const lastSession = user.lastSessionDate ? new Date(user.lastSessionDate).toDateString() : null;
    
    if (action === 'session') {
      user.sessionCount += 1;
      if (lastSession !== today) {
        user.engagementDays += 1;
      }
      user.lastSessionDate = new Date();
    }
    
    if (action === 'therapy_adoption') {
      user.therapyAdoptionCount += 1;
    }
    
    if (action === 'assessment_complete') {
      // Mood stability calculated from variance (passed in data)
      if (data && data.moodScore !== undefined) {
        user.moodStabilityScore = data.moodScore;
        console.log(`✅ Assessment complete - User: ${user.username}, Score: ${data.moodScore}, Current phase: ${user.currentPhase}`);
      }
    }
    
    // Recalculate readiness score
    const readiness = calculateReadinessScore(user);
    user.readinessScore = readiness;
    
    // Auto-advance phase based on readiness
    if (user.currentPhase === 'ai-only' && user.sessionCount >= 2 && user.moodStabilityScore !== undefined && user.moodStabilityScore !== null) {
      user.currentPhase = 'micro-therapy';
      console.log(`🎉 Phase advanced: ${user.username} → micro-therapy`);
    }
    
    if (user.currentPhase === 'micro-therapy' && user.therapyAdoptionCount >= 2 && user.engagementDays >= 3) {
      user.currentPhase = 'community-readonly';
    }
    
    if (user.currentPhase === 'community-readonly' && user.readinessScore >= 70 && user.toxicityFlags === 0) {
      user.currentPhase = 'full-access';
      user.communityReadyDate = new Date();
    }
    
    await user.save();
    
    res.json({ 
      readinessScore: user.readinessScore, 
      currentPhase: user.currentPhase,
      message: 'Engagement tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking engagement:', error);
    res.status(500).json({ error: 'Failed to track engagement' });
  }
});

// Helper function to calculate readiness score
function calculateReadinessScore(user) {
  let score = 0;
  
  // Session engagement (30 points max)
  score += Math.min((user.sessionCount / 5) * 30, 30);
  
  // Therapy adoption (25 points max)
  score += Math.min((user.therapyAdoptionCount / 3) * 25, 25);
  
  // Engagement days (20 points max)
  score += Math.min((user.engagementDays / 7) * 20, 20);
  
  // Mood stability (15 points max) - higher score = more stable
  score += Math.min((user.moodStabilityScore / 100) * 15, 15);
  
  // Reputation (10 points max)
  score += Math.min((user.reputationScore / 100) * 10, 10);
  
  // Penalty for toxicity
  score -= (user.toxicityFlags * 10);
  
  return Math.max(0, Math.min(score, 100));
}

// Get All Recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    const recommendations = await Recommendation.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Create Recommendation (Protected)
app.post('/api/recommendations', auth, async (req, res) => {
  try {
    const { type, title, description } = req.body;
    
    if (!type || !title || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check toxicity in title and description
    const titleCheck = detectToxicity(title);
    const descCheck = detectToxicity(description);
    
    if (titleCheck.isToxic || descCheck.isToxic) {
      // Flag the content
      const flagged = new FlaggedContent({
        contentType: 'recommendation',
        contentId: req.user._id,
        userId: req.user._id,
        reason: 'Automated toxicity detection',
        toxicityScore: Math.max(titleCheck.score, descCheck.score)
      });
      await flagged.save();
      
      // Update user toxicity count
      const user = await User.findById(req.user._id);
      user.toxicityFlags += 1;
      user.reputationScore = Math.max(0, user.reputationScore - 10);
      
      if (user.toxicityFlags >= 3) {
        user.isShadowBanned = true;
      }
      
      await user.save();
      
      const flaggedWords = [...titleCheck.flaggedWords, ...descCheck.flaggedWords];
      return res.status(400).json({ 
        error: 'Post contains inappropriate content. Please review our community guidelines.',
        flaggedWords
      });
    }

    const recommendation = new Recommendation({
      userId: req.user._id,
      type,
      title,
      description
    });

    await recommendation.save();
    
    const populatedRecommendation = await Recommendation.findById(recommendation._id)
      .populate('userId', 'username email');

    res.status(201).json(populatedRecommendation);
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({ error: 'Failed to create recommendation' });
  }
});

// Create Event (Protected)
app.post('/api/events', auth, async (req, res) => {
  try {
    const { sport, title, description, date, duration, maxParticipants, location } = req.body;
    
    if (!sport || !title || !description || !date || !duration || !maxParticipants || !location) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check toxicity in title and description
    const titleCheck = detectToxicity(title);
    const descCheck = detectToxicity(description);
    
    if (titleCheck.isToxic || descCheck.isToxic) {
      // Flag the content
      const flagged = new FlaggedContent({
        contentType: 'event',
        contentId: req.user._id,
        userId: req.user._id,
        reason: 'Automated toxicity detection',
        toxicityScore: Math.max(titleCheck.score, descCheck.score)
      });
      await flagged.save();
      
      // Update user toxicity count
      const user = await User.findById(req.user._id);
      user.toxicityFlags += 1;
      user.reputationScore = Math.max(0, user.reputationScore - 10);
      
      if (user.toxicityFlags >= 3) {
        user.isShadowBanned = true;
      }
      
      await user.save();
      
      const flaggedWords = [...titleCheck.flaggedWords, ...descCheck.flaggedWords];
      return res.status(400).json({ 
        error: 'Event contains inappropriate content. Please review our community guidelines.',
        flaggedWords
      });
    }

    const event = new Event({
      creatorId: req.user._id,
      sport,
      title,
      description,
      date,
      duration,
      maxParticipants,
      location
    });

    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('creatorId', 'username email');

    res.status(201).json(populatedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get All Events
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('creatorId', 'username email')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Join Event (Protected)
app.post('/api/events/:eventId/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status !== 'open') {
      return res.status(400).json({ error: 'Event is not open for joining' });
    }

    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Check if user is already a participant
    const existingParticipant = await EventParticipant.findOne({
      eventId: event._id,
      userId: req.user._id
    });

    if (existingParticipant) {
      return res.status(400).json({ error: 'You have already joined this event' });
    }

    // Create participant record
    const participant = new EventParticipant({
      eventId: event._id,
      userId: req.user._id
    });

    await participant.save();

    // Create notification for event creator
    const notification = new Notification({
      recipientId: event.creatorId,
      senderId: req.user._id,
      eventId: event._id,
      type: 'join_request',
      message: `${req.user.username} wants to join your event "${event.title}"`
    });

    await notification.save();

    res.status(201).json(participant);
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ error: 'Failed to join event' });
  }
});

// Accept/Reject Participant (Protected)
app.put('/api/events/:eventId/participants/:participantId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to manage this event' });
    }

    const participant = await EventParticipant.findById(req.params.participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    participant.status = status;
    await participant.save();

    // Create notification for the participant
    const notification = new Notification({
      recipientId: participant.userId,
      senderId: req.user._id,
      eventId: event._id,
      type: status === 'accepted' ? 'request_accepted' : 'request_rejected',
      message: status === 'accepted' 
        ? `Your request to join "${event.title}" has been accepted!`
        : `Your request to join "${event.title}" has been rejected.`
    });

    await notification.save();

    // Update event participant count if accepted
    if (status === 'accepted') {
      event.currentParticipants += 1;
      if (event.currentParticipants >= event.maxParticipants) {
        event.status = 'full';
      }
      await event.save();
    }

    res.json(participant);
  } catch (error) {
    console.error('Error updating participant status:', error);
    res.status(500).json({ error: 'Failed to update participant status' });
  }
});

// Get User's Events (Protected)
app.get('/api/events/my-events', auth, async (req, res) => {
  try {
    const createdEvents = await Event.find({ creatorId: req.user._id })
      .populate('creatorId', 'username email')
      .sort({ date: 1 });

    const joinedEvents = await EventParticipant.find({ userId: req.user._id })
      .populate({
        path: 'eventId',
        populate: { path: 'creatorId', select: 'username email' }
      })
      .sort({ createdAt: -1 });

    res.json({
      created: createdEvents,
      joined: joinedEvents
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});

// Get User's Notifications (Protected)
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .populate('senderId', 'username')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark Notification as Read (Protected)
app.put('/api/notifications/:notificationId/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this notification' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Like Event (Protected)
app.post('/api/events/:eventId/like', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const userId = req.user._id;
    
    // Remove from dislikes if present
    event.dislikes = event.dislikes.filter(id => id.toString() !== userId.toString());
    
    // Toggle like
    const likeIndex = event.likes.findIndex(id => id.toString() === userId.toString());
    if (likeIndex > -1) {
      event.likes.splice(likeIndex, 1);
    } else {
      event.likes.push(userId);
    }
    
    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Error liking event:', error);
    res.status(500).json({ error: 'Failed to like event' });
  }
});

// Dislike Event (Protected)
app.post('/api/events/:eventId/dislike', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const userId = req.user._id;
    
    // Remove from likes if present
    event.likes = event.likes.filter(id => id.toString() !== userId.toString());
    
    // Toggle dislike
    const dislikeIndex = event.dislikes.findIndex(id => id.toString() === userId.toString());
    if (dislikeIndex > -1) {
      event.dislikes.splice(dislikeIndex, 1);
    } else {
      event.dislikes.push(userId);
    }
    
    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Error disliking event:', error);
    res.status(500).json({ error: 'Failed to dislike event' });
  }
});

// Like Recommendation (Protected)
app.post('/api/recommendations/:recommendationId/like', auth, async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.recommendationId);
    
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    const userId = req.user._id;
    
    // Remove from dislikes if present
    recommendation.dislikes = recommendation.dislikes.filter(id => id.toString() !== userId.toString());
    
    // Toggle like
    const likeIndex = recommendation.likes.findIndex(id => id.toString() === userId.toString());
    if (likeIndex > -1) {
      recommendation.likes.splice(likeIndex, 1);
    } else {
      recommendation.likes.push(userId);
    }
    
    await recommendation.save();
    res.json(recommendation);
  } catch (error) {
    console.error('Error liking recommendation:', error);
    res.status(500).json({ error: 'Failed to like recommendation' });
  }
});

// Dislike Recommendation (Protected)
app.post('/api/recommendations/:recommendationId/dislike', auth, async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.recommendationId);
    
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    const userId = req.user._id;
    
    // Remove from likes if present
    recommendation.likes = recommendation.likes.filter(id => id.toString() !== userId.toString());
    
    // Toggle dislike
    const dislikeIndex = recommendation.dislikes.findIndex(id => id.toString() === userId.toString());
    if (dislikeIndex > -1) {
      recommendation.dislikes.splice(dislikeIndex, 1);
    } else {
      recommendation.dislikes.push(userId);
    }
    
    await recommendation.save();
    res.json(recommendation);
  } catch (error) {
    console.error('Error disliking recommendation:', error);
    res.status(500).json({ error: 'Failed to dislike recommendation' });
  }
});

// Get Chat Messages (Protected)
app.get('/api/chat/messages', auth, async (req, res) => {
  try {
    const messages = await ChatMessage.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('userId', 'username email')
      .lean();
    
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Toxicity Detection Helper (simple keyword-based, can integrate ML API later)
function detectToxicity(text) {
  // Expanded toxicity keywords with severity levels
  const highSeverity = [
    'kill yourself', 'kys', 'suicide', 'self harm', 'self-harm',
    'kill you', 'murder', 'rape', 'molest', 'pedophile'
  ];
  
  const mediumSeverity = [
    'hate you', 'hate them', 'stupid', 'idiot', 'moron', 'retard',
    'loser', 'worthless', 'pathetic', 'disgusting', 'trash', 'garbage',
    'die', 'death', 'threat', 'violence', 'harm', 'attack', 'beat up',
    'bully', 'abuse', 'racist', 'sexist', 'slur'
  ];
  
  const lowSeverity = [
    'dumb', 'ugly', 'fat', 'annoying', 'shut up', 'go away',
    'nobody likes you', 'hate this', 'sucks', 'terrible'
  ];
  
  const lowercaseText = text.toLowerCase();
  let score = 0;
  let flaggedWords = [];
  
  // Check high severity (0.8 per match)
  for (const keyword of highSeverity) {
    if (lowercaseText.includes(keyword)) {
      score += 0.8;
      flaggedWords.push(keyword);
    }
  }
  
  // Check medium severity (0.4 per match)
  for (const keyword of mediumSeverity) {
    if (lowercaseText.includes(keyword)) {
      score += 0.4;
      flaggedWords.push(keyword);
    }
  }
  
  // Check low severity (0.2 per match)
  for (const keyword of lowSeverity) {
    if (lowercaseText.includes(keyword)) {
      score += 0.2;
      flaggedWords.push(keyword);
    }
  }
  
  return {
    isToxic: score >= 0.5,
    score: Math.min(score, 1),
    flaggedWords
  };
}

// Send Chat Message with Toxicity Check (Protected)
app.post('/api/chat/messages', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    if (message.length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 characters)' });
    }
    
    // Check toxicity
    const toxicityCheck = detectToxicity(message);
    
    if (toxicityCheck.isToxic) {
      // Flag the content
      const flagged = new FlaggedContent({
        contentType: 'message',
        contentId: req.user._id, // Temp ID before message created
        userId: req.user._id,
        reason: 'Automated toxicity detection',
        toxicityScore: toxicityCheck.score
      });
      await flagged.save();
      
      // Update user toxicity count
      const user = await User.findById(req.user._id);
      user.toxicityFlags += 1;
      user.reputationScore = Math.max(0, user.reputationScore - 10);
      
      if (user.toxicityFlags >= 3) {
        user.isShadowBanned = true;
      }
      
      await user.save();
      
      return res.status(400).json({ 
        error: 'Message contains inappropriate content. Please review our community guidelines.',
        flaggedWords: toxicityCheck.flaggedWords
      });
    }
    
    const chatMessage = new ChatMessage({
      userId: req.user._id,
      message: message.trim()
    });
    
    await chatMessage.save();
    await chatMessage.populate('userId', 'username email');
    
    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Flag Content Manually (Protected)
app.post('/api/moderation/flag', auth, async (req, res) => {
  try {
    const { contentType, contentId, reason } = req.body;
    
    const flagged = new FlaggedContent({
      contentType,
      contentId,
      userId: req.user._id,
      reason,
      toxicityScore: 0.5 // Manual flag = moderate severity
    });
    
    await flagged.save();
    res.status(201).json({ message: 'Content flagged for review', flagId: flagged._id });
  } catch (error) {
    console.error('Error flagging content:', error);
    res.status(500).json({ error: 'Failed to flag content' });
  }
});

// Get Moderation Queue (Admin only - simplified auth for demo)
app.get('/api/moderation/queue', auth, async (req, res) => {
  try {
    const flagged = await FlaggedContent.find({ status: 'pending' })
      .populate('userId', 'username email')
      .sort({ flaggedAt: -1 })
      .limit(50);
    
    res.json(flagged);
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// Update User Reputation (Protected)
app.post('/api/user/reputation', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'positive' or 'negative'
    const user = await User.findById(req.user._id);
    
    if (action === 'positive') {
      user.reputationScore = Math.min(100, user.reputationScore + 5);
    } else if (action === 'negative') {
      user.reputationScore = Math.max(0, user.reputationScore - 10);
      user.warningCount += 1;
    }
    
    await user.save();
    res.json({ reputationScore: user.reputationScore });
  } catch (error) {
    console.error('Error updating reputation:', error);
    res.status(500).json({ error: 'Failed to update reputation' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
