// Implements the real version of listing.js's chat modal (openChatModal/
// sendChatMessage), which currently only keeps messages in an in-memory array
// with a fake simulated seller reply. Real version persists conversations and
// messages, scoped one thread per buyer per listing (see the @@unique
// constraint on Conversation), with basic read-tracking for unread counts.

const prisma = require("../prisma/client");

function toPublicMessage(message) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderName: message.sender?.name,
    text: message.text,
    createdAt: message.createdAt,
    readAt: message.readAt,
  };
}

// ===== POST /api/listings/:id/messages =====
// Buyer starts or continues a conversation about this listing. Mirrors
// openChatModal's "start the thread" + sendChatMessage's "send a message"
// in one step, since the frontend doesn't yet distinguish first-message-ever
// from a later one - it always just appends to chatHistory.

async function startOrContinueConversation(req, res) {
  const listingId = Number(req.params.id);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const text = (req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ error: "Message can't be empty." });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return res.status(404).json({ error: "Listing not found." });
  }

  if (listing.sellerId === req.user.id) {
    return res.status(400).json({ error: "You can't start a chat about your own ad." });
  }

  // upsert: first message creates the thread, every later message reuses it -
  // matches the @@unique([listingId, buyerId]) constraint exactly.
  const conversation = await prisma.conversation.upsert({
    where: { listingId_buyerId: { listingId, buyerId: req.user.id } },
    update: {},
    create: { listingId, buyerId: req.user.id, sellerId: listing.sellerId },
  });

  const message = await prisma.message.create({
    data: { conversationId: conversation.id, senderId: req.user.id, text },
    include: { sender: { select: { name: true } } },
  });

  return res.status(201).json({
    conversationId: conversation.id,
    message: toPublicMessage(message),
  });
}

// ===== GET /api/conversations =====
// Backs a future "Messages" inbox panel (currently an empty shell in
// main.js's header icon panel). Lists every conversation the logged-in user
// is part of, either as buyer or seller, each with its last message and an
// unread count scoped to this user.

async function getConversations(req, res) {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }] },
    include: {
      listing: { select: { id: true, title: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // just the last message for a preview, not the full history
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Unread count per conversation: messages not sent by this user, not yet read.
  // Run alongside the main query rather than N+1ing inside the map below.
  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      senderId: { not: req.user.id },
      readAt: null,
    },
    _count: { _all: true },
  });
  const unreadByConversation = Object.fromEntries(
    unreadCounts.map((u) => [u.conversationId, u._count._all])
  );

  return res.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      listing: c.listing,
      otherParty: req.user.id === c.buyerId ? c.seller : c.buyer,
      role: req.user.id === c.buyerId ? "buyer" : "seller",
      lastMessage: c.messages[0] ? toPublicMessage(c.messages[0]) : null,
      unreadCount: unreadByConversation[c.id] || 0,
      createdAt: c.createdAt,
    })),
  });
}

// ===== GET /api/conversations/:id/messages =====
// Full message history for one conversation. Marks the other party's
// messages as read as a side effect of opening the thread, same as any real
// chat app - matches renderChatMessages() being called whenever the modal opens.

async function getConversationMessages(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid conversation id." });
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }
  if (conversation.buyerId !== req.user.id && conversation.sellerId !== req.user.id) {
    return res.status(403).json({ error: "You're not part of this conversation." });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: { sender: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Mark the other party's unread messages as read - fire-and-forget, same
  // pattern as the view-count increment in listingController.js.
  prisma.message
    .updateMany({
      where: { conversationId: id, senderId: { not: req.user.id }, readAt: null },
      data: { readAt: new Date() },
    })
    .catch((err) => console.error("Failed to mark messages as read:", err));

  return res.json({ messages: messages.map(toPublicMessage) });
}

// ===== POST /api/conversations/:id/messages =====
// Reply within an existing conversation - works for either party, unlike
// startOrContinueConversation which is buyer-only (since only a buyer can
// originate a thread from a listing page).

async function replyToConversation(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid conversation id." });
  }

  const text = (req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ error: "Message can't be empty." });
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found." });
  }
  if (conversation.buyerId !== req.user.id && conversation.sellerId !== req.user.id) {
    return res.status(403).json({ error: "You're not part of this conversation." });
  }

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: req.user.id, text },
    include: { sender: { select: { name: true } } },
  });

  return res.status(201).json({ message: toPublicMessage(message) });
}

module.exports = {
  startOrContinueConversation,
  getConversations,
  getConversationMessages,
  replyToConversation,
};
