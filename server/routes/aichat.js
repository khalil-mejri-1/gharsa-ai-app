const express = require('express');
const router = express.Router();
const AIChat = require('../models/AIChat');

// Get history for a user
router.get('/:userId', async (req, res) => {
  try {
    const history = await AIChat.find({ userId: req.params.userId }).sort({ createdAt: 1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save a message
router.post('/', async (req, res) => {
  try {
    const { userId, text, sender } = req.body;
    const newMessage = new AIChat({ userId, text, sender });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete history
router.delete('/:userId', async (req, res) => {
  try {
    await AIChat.deleteMany({ userId: req.params.userId });
    res.json({ message: 'History deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
