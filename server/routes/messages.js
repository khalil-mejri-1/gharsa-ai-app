const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const mongoose = require('mongoose');

// Send a message
router.post('/', async (req, res) => {
  const { senderId, receiverId, text, type, mediaUrl } = req.body;
  const message = new Message({
    senderId,
    receiverId,
    text,
    type,
    mediaUrl
  });

  try {
    const newMessage = await message.save();
    
    // Broadcast via socket if receiver is online
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const receiverSocketId = userSockets[receiverId];
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    // Create a Notification so it's saved in the database
    const User = mongoose.model('User');
    const Notification = mongoose.model('Notification');
    const sender = await User.findById(senderId);
    
    if (sender) {
      const notification = new Notification({
        receiver: receiverId,
        sender: senderId,
        senderName: sender.fullName || `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'User',
        senderAvatar: sender.profilePicture || sender.avatar || '',
        type: 'message'
      });
      await notification.save();
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newNotification', notification);
      }
    }
    
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get unread conversations count for a user (distinct senders)
router.get('/unread-count/:userId', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const objectId = new mongoose.Types.ObjectId(req.params.userId);
    const distinctSenders = await Message.distinct('senderId', { receiverId: objectId, isRead: false });
    res.json({ count: distinctSenders.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find all messages where the user is sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 });

    const conversationsMap = new Map();

    // Group by the other user
    messages.forEach(msg => {
      const otherUserId = msg.senderId.toString() === userId ? msg.receiverId.toString() : msg.senderId.toString();
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          lastMsg: msg.text,
          time: msg.createdAt,
          unreadCount: 0
        });
      }

      // Count unread messages from this specific user
      if (msg.receiverId.toString() === userId && !msg.isRead) {
        conversationsMap.get(otherUserId).unreadCount += 1;
      }
    });

    // Populate user details for each conversation
    const User = mongoose.model('User'); 
    const conversations = Array.from(conversationsMap.values());
    
    for (let conv of conversations) {
      const user = await User.findById(conv.userId).select('fullName firstName lastName profilePicture avatar');
      if (user) {
        conv.name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        conv.avatar = user.profilePicture || user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop';
      } else {
        conv.name = 'Unknown User';
        conv.avatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop';
      }
    }

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark messages as read between two users
router.post('/read/:userId/:senderId', async (req, res) => {
  try {
    const { userId, senderId } = req.params;
    await Message.updateMany(
      { receiverId: userId, senderId: senderId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete all messages between two users
router.delete('/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    await Message.deleteMany({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    });
    res.json({ message: 'Conversation cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages between two users
router.get('/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
