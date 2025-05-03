// Backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        // The conversation this message belongs to
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation', // Link to Conversation model
            required: true,
            index: true // Index for faster fetching of messages for a conversation
        },
        // Who sent the message
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Link to User model
            required: true
        },
        // Message content
        content: {
            type: String,
            required: [true, "Message content cannot be empty"],
            trim: true
        },

    },
    {
        timestamps: true // Use createdAt for message timestamp
    }
);

module.exports = mongoose.model('Message', messageSchema);