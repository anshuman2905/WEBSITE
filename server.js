require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

// create uploads folder if not exist
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// serve uploaded images
app.use('/uploads', express.static(UPLOAD_DIR));

// serve frontend static files from public
app.use(express.static(path.join(__dirname, 'public')));

// Tasks list (server-side source of truth)
const TASKS = [
  "Plant seeds in your farm",
  "Water your crops",
  "Add compost or organic fertilizer",
  "Monitor pest/disease signs",
  "Harvest the produce"
];

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function(req, file, cb) {
    const safe = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, safe);
  }
});
const upload = multer({ storage });

// DB connect
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gamified-farm';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(e => console.error('MongoDB connection error:', e.message));

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing authorization header' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Invalid token format' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Routes

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { name, phoneNo, password, farmSize, location } = req.body;
    if (!name || !phoneNo || !password) return res.status(400).json({ message: 'name, phoneNo and password required' });

    const existing = await User.findOne({ phoneNo });
    if (existing) return res.status(400).json({ message: 'Phone number already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, phoneNo, passwordHash, farmSize, location });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Signup successful',
      token,
      user: { name: user.name, phoneNo: user.phoneNo, farmSize: user.farmSize, location: user.location, currentTaskIndex: user.currentTaskIndex }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

// Signin
app.post('/api/signin', async (req, res) => {
  try {
    const { phoneNo, password } = req.body;
    if (!phoneNo || !password) return res.status(400).json({ message: 'phoneNo and password required' });

    const user = await User.findOne({ phoneNo });
    if (!user) return res.status(400).json({ message: 'Invalid phone or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid phone or password' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Signin successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signin failed', error: err.message });
  }
});

// Get tasks
app.get('/api/tasks', (req, res) => {
  res.json(TASKS);
});

// Get logged in user info
app.get('/api/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      _id: user._id,
      name: user.name,
      phoneNo: user.phoneNo,
      farmSize: user.farmSize,
      location: user.location,
      currentTaskIndex: user.currentTaskIndex,
      tasksCompleted: user.tasksCompleted
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user', error: err.message });
  }
});

// Complete current task (upload photo)
app.post('/api/complete-task', auth, upload.single('photo'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.currentTaskIndex >= TASKS.length) {
      return res.status(400).json({ message: 'All tasks already completed' });
    }

    if (!req.file) return res.status(400).json({ message: 'Photo is required' });

    const photoPath = '/uploads/' + req.file.filename;

    // Push task completion
    user.tasksCompleted.push({
      taskIndex: user.currentTaskIndex,
      photoPath,
      completedAt: new Date()
    });

    // Reward points per task (e.g., 10 points each)
    user.points += 10;

    user.currentTaskIndex += 1;
    await user.save();

    res.json({
      message: 'Task completed',
      user: {
        currentTaskIndex: user.currentTaskIndex,
        tasksCompleted: user.tasksCompleted,
        points: user.points   // <-- return updated points
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// Fallback: serve index.html for any unknown routes (so front-end routing works)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});