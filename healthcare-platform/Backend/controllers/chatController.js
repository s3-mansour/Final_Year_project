// Backend/controllers/chatController.js
const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User'); // Needed for populating participant details
const mongoose = require('mongoose');

// @desc    Get all conversations for the logged-in user
// @route   GET /api/chat
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const conversations = await Conversation.find({ participants: userId })
            .populate('participants', '_id firstName lastName email role') // Populate user details (exclude password)
            .populate('lastMessage') // Populate the last message document
            .sort({ updatedAt: -1 }); // Sort by most recently updated conversation

        await Conversation.populate(conversations, {
             path: 'lastMessage.sender',
             select: '_id firstName lastName email role'
        });


        res.status(200).json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500);
        throw new Error("Server error fetching conversations.");
    }
});

// @desc    Get messages for a specific conversation
// @route   GET /api/chat/:conversationId/messages?page=1&limit=20
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const conversationId = req.params.conversationId;
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 30; // Default to 30 messages per page
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        res.status(400); throw new Error("Invalid Conversation ID format.");
    }

    try {
        // Verify user is part of the conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId // Ensure logged-in user is a participant
        });

        if (!conversation) {
            res.status(403); // Forbidden or 404 Not Found
            throw new Error("Conversation not found or user not authorized.");
        }

        //  Fetch messages with pagination, sorted oldest first for display
        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', '_id firstName lastName email role') // Populate sender details
            .sort({ createdAt: -1 }) // Fetch newest first for pagination limit/skip
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: 1 }); // Then sort ascending for display order

        const totalMessages = await Message.countDocuments({ conversation: conversationId });

        res.status(200).json({
             messages,
             currentPage: page,
             totalPages: Math.ceil(totalMessages / limit),
             totalMessages
        });

    } catch (error) {
        console.error(`Error fetching messages for conversation ${conversationId}:`, error);
        res.status(500);
        throw new Error("Server error fetching messages.");
    }
});


// @desc    Find or Create a 1-on-1 conversation
// @route   POST /api/chat/findOrCreate
// @access  Private
const findOrCreateConversation = asyncHandler(async (req, res) => {
    const senderId = req.user._id;
    const { recipientId } = req.body;

    if (!recipientId) {
        res.status(400); throw new Error("Recipient ID is required.");
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
         res.status(400); throw new Error("Invalid Recipient ID format.");
    }
    if (senderId.toString() === recipientId.toString()) {
        res.status(400); throw new Error("Cannot create a conversation with yourself.");
    }

    // Check if recipient user exists
     const recipientExists = await User.findById(recipientId);
     if (!recipientExists) {
         res.status(404); throw new Error("Recipient user not found.");
     }

    try {
        // Look for an existing conversation with exactly these two participants
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId], $size: 2 } 
        }).populate('participants', '_id firstName lastName email role'); // Populate participants for response

        if (conversation) {
            // Conversation already exists
            console.log(`Conversation found between ${senderId} and ${recipientId}: ${conversation._id}`);
            res.status(200).json(conversation);
        } else {
            // Create a new conversation
             console.log(`Creating new conversation between ${senderId} and ${recipientId}`);
            conversation = await Conversation.create({
                participants: [senderId, recipientId]
            });
            // Re-populate after creation to send back full details
            const newConversation = await Conversation.findById(conversation._id)
                                        .populate('participants', '_id firstName lastName email role');
            res.status(201).json(newConversation);
        }
    } catch (error) {
        console.error("Error finding or creating conversation:", error);
        res.status(500);
        throw new Error("Server error handling conversation.");
    }
});
const deleteConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;  // Get conversationId from request params
    const userId = req.user._id;  // Get user ID from logged-in user (assuming authentication middleware is set up)
  
    // Try to find and delete the conversation, ensuring the user is a participant in it
    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      participants: userId,  // Ensure the logged-in user is part of the conversation
    });
  
    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found or user is not a participant.');
    }
  
    // Emit a Socket.IO event to all connected clients
    // This can be used to update the frontend in real-time
    io.emit('conversationDeleted', conversationId);  // 'io' is your Socket.IO instance
  
    res.status(200).json({ message: 'Conversation deleted successfully.' });
  });
  
  module.exports = {
    deleteConversation,
  };


module.exports = {
    getConversations,
    getMessages,
    deleteConversation,
    findOrCreateConversation
};