import React, { useState, useCallback } from 'react';
// Import the useSocket hook to get the socket instance
import { useSocket } from '../../context/SocketContext'; // Adjust path as needed
import { FaPaperPlane } from 'react-icons/fa'; // Send icon
import './styles/MessageInput.css'; // Create this CSS file

const MessageInput = ({ conversationId, recipientId }) => {
    // State for the message input field
    const [messageContent, setMessageContent] = useState('');
    const { socket, isConnected } = useSocket(); // Get socket instance from context

    // Handler for input changes
    const handleChange = (e) => {
        setMessageContent(e.target.value);
        // TODO: Emit 'typing' event via socket here (optional)
    };

    // Handler for sending the message
    const handleSendMessage = useCallback((e) => {
        // Prevent default form submission if used within a form
        if (e) e.preventDefault();

        // Trim message content and check if it's empty or only whitespace
        const trimmedContent = messageContent.trim();
        if (!trimmedContent) {
            console.log("Cannot send empty message.");
            return; // Don't send empty messages
        }

        // Check if socket is connected and recipientId is available
        if (socket && isConnected && recipientId) {
            console.log(`Sending message to ${recipientId}: ${trimmedContent}`);
            // Emit the 'sendMessage' event to the backend server
            socket.emit('sendMessage', {
                recipientId: recipientId,
                content: trimmedContent,
                // Optionally include conversationId if needed by backend logic for saving
                // conversationId: conversationId
            });

            // Clear the input field after sending
            setMessageContent('');
            // TODO: Emit 'stopTyping' event here (optional)

        } else {
            console.error("Socket not connected or recipient ID missing. Cannot send message.");
            // Optionally display an error to the user (e.g., using a toast)
            alert("Error: Could not send message. Connection issue.");
        }
    }, [messageContent, socket, isConnected, recipientId]); // Dependencies

    // Handler for pressing Enter key to send
    const handleKeyDown = (e) => {
        // Send message if Enter key is pressed without Shift key
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default Enter behavior (new line)
            handleSendMessage(); // Call the send message handler
        }
    };


    return (
        <div className="message-input-container">
            <textarea
                className="message-textarea"
                value={messageContent}
                onChange={handleChange}
                onKeyDown={handleKeyDown} // Add keydown listener
                placeholder="Type your message here..."
                rows="2" // Start with 2 rows, can expand
                disabled={!isConnected || !recipientId} // Disable if not connected or no recipient selected
            />
            <button
                className="send-message-button"
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || !isConnected || !recipientId} // Disable if no content or not ready
                aria-label="Send message"
            >
                <FaPaperPlane /> {/* Send Icon */}
            </button>
        </div>
    );
};

export default MessageInput;