// Backend/models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
    {
        // Array of participants (references User model)
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // Link to your User model
                required: true
            }
        ],
        // Optional: Store last message details for quick preview in conversation lists
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message' // Link to your Message model
        },
        // Optional: Fields for group chats (add later if needed)
        // groupName: { type: String, trim: true },
        // groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        // isGroupChat: { type: Boolean, default: false }
    },
    {
        timestamps: true // Adds createdAt and updatedAt
    }
);

// Optional Index: May help queries finding conversations by participants faster,
// but consider impact on writes and specific query patterns.
// conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);