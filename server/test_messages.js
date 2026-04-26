const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'gharsa' });
    console.log('Connected to DB');
    
    // We need to define schemas to test
    const userSchema = new mongoose.Schema({
      firstName: { type: String },
      lastName: { type: String },
      fullName: { type: String },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['farmer', 'agronomist'], default: 'farmer' },
      profilePicture: { type: String },
      avatar: { type: String },
      plants: { type: [String], default: [] },
      following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      createdAt: { type: Date, default: Date.now }
    });
    const User = mongoose.model('User', userSchema);
    
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
    
    // Get an existing user ID (let's pick any user that has messages)
    const allMessages = await Message.find().sort({ createdAt: -1 }).limit(10);
    console.log('Types of senderId and receiverId in DB:');
    allMessages.forEach(m => {
      console.log(`- Type of senderId: ${typeof m.senderId}, Is ObjectId: ${m.senderId instanceof mongoose.Types.ObjectId}`);
    });
    
    process.exit(0);
    
    const userId = someMessage.senderId.toString();
    console.log('Testing with userId:', userId);
    
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${messages.length} messages`);
    
    const conversationsMap = new Map();
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
      if (msg.receiverId.toString() === userId && !msg.isRead) {
        conversationsMap.get(otherUserId).unreadCount += 1;
      }
    });
    
    const conversations = Array.from(conversationsMap.values());
    console.log('Conversations Map size:', conversations.length);
    
    for (let conv of conversations) {
      const user = await User.findById(conv.userId).select('fullName firstName lastName profilePicture avatar');
      if (user) {
        conv.name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
      } else {
        conv.name = 'Unknown User';
      }
    }
    
    console.log('Final result:', JSON.stringify(conversations, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
