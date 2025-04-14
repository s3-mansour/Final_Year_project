// Backend/routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const {
    getConversations,
    getMessages,
    findOrCreateConversation
} = require("../controllers/chatController");

const { protect } = require("../middleware/authMiddleware");

// Apply protect middleware to all chat routes
router.use(protect);

// GET all conversations for the logged-in user
router.get("/", getConversations);

// POST to find or create a 1-on-1 conversation
router.post("/findOrCreate", findOrCreateConversation);

// GET messages for a specific conversation (using conversationId from URL param)
// Includes optional pagination query params (?page=1&limit=30)
router.get("/:conversationId/messages", getMessages);


module.exports = router;