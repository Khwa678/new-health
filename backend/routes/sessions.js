const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// GET /api/sessions/:sessionId — load existing session
router.get('/:sessionId', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      sessionId: req.params.sessionId,
    });
    if (!conversation) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:sessionId — clear session
router.delete('/:sessionId', async (req, res) => {
  try {
    await Conversation.deleteOne({ sessionId: req.params.sessionId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;