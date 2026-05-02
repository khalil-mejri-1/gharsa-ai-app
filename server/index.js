const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
// const { OAuth2Client } = require('google-auth-library');
// const googleClient = new OAuth2Client('1009149258614-7pmjbda89uuh3n7ii4m2r19tit3i3kng.apps.googleusercontent.com');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use('/uploads', express.static('uploads'));

const fs = require('fs');
const path = require('path');

// Audio Upload Endpoint
app.post('/api/upload-audio', async (req, res) => {
  try {
    const { audio, userId } = req.body;
    if (!audio) return res.status(400).json({ message: 'No audio provided' });

    const fileName = `voice_${userId}_${Date.now()}.m4a`;
    const filePath = path.join(__dirname, 'uploads', fileName);

    // Remove header if present (data:audio/m4a;base64,)
    const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');

    fs.writeFileSync(filePath, base64Data, 'base64');

    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const audioUrl = `${serverUrl}/uploads/${fileName}`;

    res.json({ audioUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Failed to save audio' });
  }
});

// Global Socket mapping
const userSockets = {};
app.set('io', io);
app.set('userSockets', userSockets);
io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    userSockets[userId] = socket.id;
    socket.join('feed'); // Join a common room for feed updates
  });
  socket.on('disconnect', () => {
    for (let userId in userSockets) {
      if (userSockets[userId] === socket.id) delete userSockets[userId];
    }
  });
});

app.get('/', (req, res) => {
  res.send('Gharsa API is running 1/5/2026');
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: String,
  senderAvatar: String,
  type: { type: String, enum: ['like', 'comment', 'follow', 'unfollow', 'message'], required: true },
  postId: { type: String, required: false },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);// User Schema
const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  fullName: { type: String }, // Keep for compatibility
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'agronomist'], default: 'farmer' },
  profilePicture: { type: String },
  avatar: { type: String }, // Keep for compatibility
  plants: { type: [String], default: [] },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expoPushToken: String,
  createdAt: { type: Date, default: Date.now }
});


const User = mongoose.model('User', userSchema);

// Post Schema
const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: String, // Cached for efficiency
  role: String,
  avatar: String,
  content: { type: String, required: true },
  image: String,
  video: String,
  tag: { type: String, default: 'GENERAL' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: String,
    avatar: String,
    role: String,
    text: String,
    isExpert: Boolean,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  console.log('📩 Registration request received:', req.body);
  try {
    const { fullName, email, password, role, avatar } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password (using Sync for better compatibility in some environments)
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role,
      avatar,
      plants: req.body.plants || []
    });

    await newUser.save();

    // Create token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName || `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || 'User',
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.profilePicture || newUser.avatar || ''
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'GHARSA_DB_ERROR: ' + error.message });
  }
});

// Login Endpoint (Optional but good to have)
app.post('/api/auth/login', async (req, res) => {
  console.log('📩 Login request received for email:', req.body.email);
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        email: user.email,
        role: user.role,
        avatar: user.profilePicture || user.avatar || '',
        plants: user.plants || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

/*
// Google Sign-In Endpoint
app.post('/api/auth/google', async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: '1009149258614-7pmjbda89uuh3n7ii4m2r19tit3i3kng.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      // Create user if not exists (dummy password since it's Google login)
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(sub + process.env.JWT_SECRET, salt);

      user = new User({
        fullName: name,
        email: email,
        password: hashedPassword,
        avatar: picture,
        role: 'farmer' // Default role
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        plants: user.plants || []
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
});
*/

// Push Token Registration
app.post('/api/users/push-token', async (req, res) => {
  const { userId, pushToken } = req.body;
  try {
    await User.findByIdAndUpdate(userId, { expoPushToken: pushToken });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to register push token' });
  }
});

// --- Profile & Following Endpoints ---

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Map fields for the app
    const userObj = user.toObject();
    const responseData = {
      ...userObj,
      fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      avatar: user.profilePicture || user.avatar || ''
    };

    res.json(responseData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Update profile
app.put('/api/users/:id', async (req, res) => {
  try {
    const { plants, fullName, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { plants, fullName, avatar } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Follow/Unfollow a user
app.post('/api/users/follow/:id', async (req, res) => {
  const { currentUserId } = req.body;
  const targetId = req.params.id;
  if (!currentUserId || !targetId) return res.status(400).json("User IDs missing");
  if (currentUserId === targetId) return res.status(400).json("Cannot follow yourself");

  try {
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetId);

    if (currentUser.following.includes(targetId)) {
      currentUser.following.pull(targetId);
      targetUser.followers.pull(currentUserId);
      await currentUser.save();
      await targetUser.save();

      // Create unfollow notification
      const notification = new Notification({
        receiver: targetId,
        sender: currentUserId,
        senderName: currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User',
        senderAvatar: currentUser.profilePicture || currentUser.avatar || '',
        type: 'unfollow'
      });
      await notification.save();

      if (userSockets[targetId.toString()]) {
        io.to(userSockets[targetId.toString()]).emit('newNotification', notification);
      }

      res.json({ following: false });
    } else {
      currentUser.following.push(targetId);
      targetUser.followers.push(currentUserId);
      await currentUser.save();
      await targetUser.save();

      // Create notification
      const notification = new Notification({
        receiver: targetId,
        sender: currentUserId,
        senderName: currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User',
        senderAvatar: currentUser.profilePicture || currentUser.avatar || '',
        type: 'follow'
      });
      await notification.save();

      if (userSockets[targetId.toString()]) {
        io.to(userSockets[targetId.toString()]).emit('newNotification', notification);
      }

      // Send Push Notification
      if (targetUser.expoPushToken) {
        const { sendPushNotification } = require('./utils/pushNotifications');
        sendPushNotification(
          targetUser.expoPushToken,
          'New Follower',
          `${currentUser.fullName || 'Someone'} started following you.`
        );
      }

      res.json({ following: true });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get following list for circular modal
app.get('/api/users/following/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('following', 'fullName firstName lastName profilePicture avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const mappedFollowing = (user.following || []).map(f => {
      const fObj = f.toObject();
      return {
        ...fObj,
        fullName: f.fullName || `${f.firstName || ''} ${f.lastName || ''}`.trim() || 'User',
        avatar: f.profilePicture || f.avatar || ''
      };
    });

    res.json(mappedFollowing);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get mutual friends (Mutual following)
app.get('/api/users/friends/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('following', 'fullName firstName lastName profilePicture avatar followers following');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Filter to find only those who follow the user back
    const mutuals = (user.following || []).filter(f => {
      // Check if current userId is in the target user's following list
      return f.following && f.following.some(id => id.toString() === req.params.userId);
    }).map(f => {
      const fObj = f.toObject();
      return {
        ...fObj,
        fullName: f.fullName || `${f.firstName || ''} ${f.lastName || ''}`.trim() || 'User',
        avatar: f.profilePicture || f.avatar || ''
      };
    });

    res.json(mutuals);
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json(err);
  }
});

// --- Community / Post Endpoints ---

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a post
app.post('/api/posts', async (req, res) => {
  console.log('Received post request:', req.body.content); // Debug log
  try {
    const { userId, content, image, video, tag } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newPost = new Post({
      user: userId,
      fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      role: user.role,
      avatar: user.profilePicture || user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop',
      content,
      image,
      video,
      tag: tag || 'GENERAL'
    });

    await newPost.save();
    // Broadcast new post to everyone in the feed
    io.to('feed').emit('newPost', newPost);
    console.log('Post saved successfully');
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Post creation error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Like/Unlike a post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
      // Create notification
      if (post.user.toString() !== userId.toString()) {
        const liker = await User.findById(userId);
        if (liker) {
          const notification = new Notification({
            receiver: post.user,
            sender: userId,
            senderName: liker.fullName || `${liker.firstName || ''} ${liker.lastName || ''}`.trim() || 'User',
            senderAvatar: liker.profilePicture || liker.avatar || '',
            type: 'like',
            postId: post._id.toString()
          });
          await notification.save();
          if (userSockets[post.user.toString()]) {
            io.to(userSockets[post.user.toString()]).emit('newNotification', notification);
          }

          // Send Push Notification
          const postOwner = await User.findById(post.user);
          if (postOwner && postOwner.expoPushToken) {
            const { sendPushNotification } = require('./utils/pushNotifications');
            sendPushNotification(
              postOwner.expoPushToken,
              'New Like',
              `${liker.fullName || 'Someone'} liked your post.`
            );
          }
        }
      }
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    // Broadcast update to everyone in the feed
    io.to('feed').emit('postUpdate', { postId: post._id, likes: post.likes, comments: post.comments });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get users who liked a post
app.get('/api/posts/:id/likers', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('likes', 'fullName firstName lastName profilePicture avatar role');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const mappedLikers = post.likes.map(u => {
      const uObj = u.toObject();
      return {
        ...uObj,
        fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
        avatar: u.profilePicture || u.avatar || ''
      };
    });
    res.json(mappedLikers);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Comment on a post
app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    const { userId, text } = req.body;
    const user = await User.findById(userId);
    const post = await Post.findById(req.params.id);

    if (!user || !post) return res.status(404).json({ message: 'User or Post not found' });

    post.comments.push({
      user: userId,
      fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      avatar: user.profilePicture || user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop',
      role: user.role,
      text,
      isExpert: user.role === 'agronomist'
    });

    await post.save();
    // Broadcast update to everyone in the feed
    io.to('feed').emit('postUpdate', { postId: post._id, likes: post.likes, comments: post.comments });

    // Create notification
    if (post.user.toString() !== userId.toString()) {
      const notification = new Notification({
        receiver: post.user,
        sender: userId,
        senderName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        senderAvatar: user.profilePicture || user.avatar || '',
        type: 'comment',
        postId: post._id.toString()
      });
      await notification.save();
      if (userSockets[post.user.toString()]) {
        io.to(userSockets[post.user.toString()]).emit('newNotification', notification);
      }

      // Send Push Notification
      const postOwner = await User.findById(post.user);
      if (postOwner && postOwner.expoPushToken) {
        const { sendPushNotification } = require('./utils/pushNotifications');
        sendPushNotification(
          postOwner.expoPushToken,
          'New Comment',
          `${user.fullName || 'Someone'} commented on your post.`
        );
      }
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Delete a post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    // Broadcast post deletion
    io.to('feed').emit('postDeleted', { postId: req.params.id });
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a comment
app.delete('/api/posts/:postId/comments/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments = post.comments.filter(c => c._id.toString() !== commentId);
    await post.save();
    // Broadcast update
    io.to('feed').emit('postUpdate', { postId: post._id, likes: post.likes, comments: post.comments });
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.params.userId }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark Notifications as Read
app.post('/api/notifications/read/:userId', async (req, res) => {
  try {
    await Notification.updateMany({ receiver: req.params.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete all notifications for a user
app.delete('/api/notifications/:userId', async (req, res) => {
  try {
    await Notification.deleteMany({ receiver: req.params.userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Admin Endpoints (Dangerous) ---
app.delete('/api/admin/delete-all-users', async (req, res) => {
  try {
    // Delete all users
    await User.deleteMany({});
    // Also delete all posts and notifications to avoid orphans
    await Post.deleteMany({});
    await Notification.deleteMany({});

    // Clear the socket map
    for (let key in userSockets) delete userSockets[key];

    res.json({ message: 'All accounts and associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Message Routes
const messageRoutes = require('./routes/messages');
const aichatRoutes = require('./routes/aichat');
app.use('/api/messages', messageRoutes);
app.use('/api/aichat', aichatRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { dbName: 'gharsa' })
  .then(() => {
    console.log('✅ Connected to MongoDB (Gharsa Database)');
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });
