const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: String,
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientName: String,
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  message: {
    type: String,
    required: true,
    maxlength: [2000, 'Le message ne peut pas dépasser 2000 caractères'],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index pour les recherches de conversations
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ recipient: 1 });

module.exports = mongoose.model('Message', MessageSchema);
