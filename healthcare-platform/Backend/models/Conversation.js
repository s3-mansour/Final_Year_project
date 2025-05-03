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
      
    },
    {
        timestamps: true // Adds createdAt and updatedAt
    }
);


module.exports = mongoose.model('Conversation', conversationSchema);