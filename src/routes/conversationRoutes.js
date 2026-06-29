// Routes for a future "Messages" inbox panel - listing the logged-in user's
// conversations, viewing a conversation's full history, and replying within
// one. Starting a brand new conversation from a listing page lives in
// engagementRoutes.js instead (POST /api/listings/:id/messages), since that
// one's buyer-only and listing-scoped.

const express = require("express");
const router = express.Router();
const {
  getConversations,
  getConversationMessages,
  replyToConversation,
} = require("../controllers/messageController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getConversations);
router.get("/:id/messages", requireAuth, getConversationMessages);
router.post("/:id/messages", requireAuth, replyToConversation);

module.exports = router;
