const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'gharsa' });
    console.log('Connected to DB');
    
    const MessageSchema = new mongoose.Schema({
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      text: { type: String, required: true },
      type: { type: String, enum: ['text', 'image', 'video', 'audio'], default: 'text' },
      mediaUrl: { type: String },
      isRead: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });
    const Message = mongoose.model('Message', MessageSchema);
    
    // Pick an existing user ID
    const userId = "69ecbcc3fee0a0177d9d7cdd"; // The user from earlier
    
    // Test the distinct query
    const distinctSenders = await Message.distinct('senderId', { receiverId: userId, isRead: false });
    console.log('Distinct senders:', distinctSenders);
    console.log('Count:', distinctSenders.length);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
