const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  publications: { type: Array, default: [] },
  trials: { type: Array, default: [] },
  llmResponse: { type: Object, default: null },
  totalRetrieved: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

const ConversationSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    patientName: { type: String, default: '' },
    disease: { type: String, required: true },
    location: { type: String, default: '' },
    additionalContext: { type: String, default: '' },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

// Virtual for message count
ConversationSchema.virtual('messageCount').get(function () {
  return this.messages.length;
});

module.exports = mongoose.model('Conversation', ConversationSchema);