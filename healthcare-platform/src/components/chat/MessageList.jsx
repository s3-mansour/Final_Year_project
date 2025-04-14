import React, { useEffect, useRef } from 'react';
import './styles/MessageList.css'; // Create this CSS file

// Helper to format date/time display (or import from Chat.jsx/utils)
const formatDateTimeDisplay = (dateString) => {
    if (!dateString) return '';
    try { return new Date(dateString).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
};

const MessageList = ({ messages = [], currentUser }) => {
    const messagesEndRef = useRef(null); // Ref to scroll to bottom

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]); // Dependency on the messages array

    if (!currentUser?._id) {
        // Optional: Render nothing or a placeholder if currentUser isn't loaded yet
        return <div className="message-list-container">Loading user...</div>;
    }

    return (
        <div className="message-list-container">
            {Array.isArray(messages) && messages.map((msg) => {
                // Determine if the message was sent by the current user
                const isSender = msg.sender?._id === currentUser._id;
                // console.log(`Msg ${msg._id}: Sender=${msg.sender?._id}, Current=${currentUser._id}, isSender=${isSender}`); // Debugging log

                return (
                    <div
                        key={msg._id || msg.tempId} // Use tempId for optimistic UI later if needed
                        className={`message-bubble-container ${isSender ? 'sent' : 'received'}`}
                    >
                        <div className={`message-bubble ${isSender ? 'sent-bubble' : 'received-bubble'}`}>
                            {/* Optionally display sender name for received messages */}
                            {!isSender && (
                                <div className="message-sender-name">
                                    {msg.sender?.firstName || 'User'}
                                </div>
                            )}
                            <div className="message-content">
                                {msg.content}
                            </div>
                            <div className="message-timestamp">
                                {formatDateTimeDisplay(msg.createdAt || msg.timestamp)} {/* Use createdAt from DB or timestamp from socket */}
                            </div>
                        </div>
                    </div>
                );
            })}
            {/* Empty div at the end to scroll to */}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;