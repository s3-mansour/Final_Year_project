// src/pages/Chat.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// Services
import * as chatService from '../services/chatService'; // Import the service module
import { getUserProfile, logoutUser } from '../services/authService';
import { getConsultantsList } from '../services/userService'; // Assuming this service exists
import { getPatientsList } from '../services/consultantService'; // Assuming this service exists
// Components
import Modal from '../components/Modal'; // Import your custom Modal component
import MessageList from '../components/chat/MessageList'; // Assuming MessageList component
import MessageInput from '../components/chat/MessageInput'; // Assuming MessageInput component
// Context Hook
import { useSocket } from '../context/SocketContext'; // Import useSocket hook
// Icons
import { FaPlus, FaTrashAlt, FaChevronLeft, FaChevronRight,FaArrowLeft  } from 'react-icons/fa';
// Styles
import './styles/Chat.css'; // Assuming chat styling

// Helper to format date/time display (Keeping it as it was in your provided code)
const formatDateTimeDisplay = (dateString) => {
    if (!dateString) return '';
    try { return new Date(dateString).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return 'Invalid Date'; }
};

const Chat = () => {
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket(); // Get socket instance and connection status

    // --- State ---
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [errorConversations, setErrorConversations] = useState('');
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [selectedConversationName, setSelectedConversationName] = useState('');
    const [selectedConversation, setSelectedConversation] = useState(null); // Full selected conversation object
    const [messages, setMessages] = useState([]); // Messages for the selected conversation
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [errorMessages, setErrorMessages] = useState('');
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false); // Controls visibility of the "Start New Chat" modal
    const [potentialRecipients, setPotentialRecipients] = useState([]);
    const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
    const [errorRecipients, setErrorRecipients] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isConvSidebarOpen, setIsConvSidebarOpen] = useState(true);

    // *** State for Delete Confirmation Modal ***
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [deleteModalConvId, setDeleteModalConvId] = useState(null); // Stores the ID of the conversation to delete
    const [deleteModalConvName, setDeleteModalConvName] = useState(''); // Stores the name for the modal message


    // --- Effects ---

    // Effect to fetch initial data (user profile & conversations) on component mount.
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            setIsLoadingConversations(true); setErrorConversations(''); setCurrentUser(null); setConversations([]);
            try {
                const profileData = await getUserProfile(); // Fetch logged-in user's profile.
                if (!isMounted) return; // If component unmounted, stop here.
                setCurrentUser(profileData); // Set current user state.
                if (profileData?._id) {
                    const convData = await chatService.getConversations(); // Use chatService
                    if (!isMounted) return; // If component unmounted, stop here.
                    setConversations(Array.isArray(convData) ? convData : []); // Set conversations state.
                } else { throw new Error("Failed to load user profile."); } // Throw error if profile data is incomplete.
            } catch (error) {
                if (isMounted) {
                    console.error("Chat initial data error:", error);
                    setErrorConversations(error.message || 'Failed load.'); // Set error message.
                    setConversations([]); setCurrentUser(null);
                    if (error.message.toLowerCase().includes('unauthorized') || error?.response?.status === 401) {
                         logoutUser();
                         navigate('/login', {replace: true});
                    }
                }
            } finally {
                if (isMounted) { setIsLoadingConversations(false); } // Finish loading conversations.
            }
        };
        loadInitialData();
        return () => { isMounted = false; }; // Cleanup function to set isMounted to false on unmount.
    }, [navigate]);

    // Fetch potential recipients for new chat modal (utility function).
    const loadPotentialRecipients = useCallback(async () => {
        if (!currentUser?._id || !currentUser?.role) return;
        setIsLoadingRecipients(true); setErrorRecipients(''); setPotentialRecipients([]); // Start loading recipients.
        try {
            let data;
            if (currentUser.role === 'patient') { data = await getConsultantsList(); } // Assuming getConsultantsList exists.
            else if (currentUser.role === 'doctor') { data = await getPatientsList(); } // Assuming getPatientsList exists.
            else { throw new Error("User role cannot initiate chats."); } // Handle unexpected roles.
            const filteredData = Array.isArray(data) ? data.filter(user => user._id !== currentUser._id) : [];
            setPotentialRecipients(filteredData); // Set potential recipients state.
        } catch (error) {
            console.error("Error fetching recipients:", error);
            setErrorRecipients(error.message || 'Failed to load users.');
            setPotentialRecipients([]); // Clear list on error.
        } finally {
            setIsLoadingRecipients(false); // Finish loading recipients.
        }
    }, [currentUser]);

    // Fetch messages for selected conversation (utility function).
     const fetchMessagesForConversation = useCallback(async (convId) => {
        if (!convId) return;
        setErrorMessages(''); setMessages([]); setIsLoadingMessages(true);
        try {
            const messageData = await chatService.getMessages(convId); // Use chatService
            if (messageData && Array.isArray(messageData.messages)) { setMessages(messageData.messages); }
            else { setMessages([]); }
        } catch (error) {
            setErrorMessages(error.message || "Failed to load messages."); // Set error message.
            setMessages([]); console.error(error); // Log error details.
        } finally {
            setIsLoadingMessages(false); // Finish loading messages.
        }
    }, []); // Dependency array is empty as it's a utility function, relies on convId passed in.


    // --- Socket.IO Listeners ---
    // Effect for setting up Socket.IO listeners. Runs when socket or connection status changes.
    useEffect(() => {
        // Only set up listeners if the socket is connected and available.
        if (!socket || !isConnected) {
            console.log("Socket not ready for message listener.");
            return;
        }
        console.log(`Setting up Socket.IO listeners (Socket ID: ${socket.id})`);

        // Handler for receiving messages sent by *other* users.
        const handleReceiveMessage = (newMessage) => {
            console.log('Received message via socket:', newMessage);
            const messageConversationId = newMessage?.conversation?._id || newMessage?.conversation;
            // Check if the message belongs to the currently selected conversation.
            if (messageConversationId && messageConversationId === selectedConversationId) {
                console.log(`Msg for selected convo (${selectedConversationId}). Adding.`);
                setMessages(prevMessages => [...prevMessages, newMessage]);
            } else {
                console.log(`Msg for different convo: ${messageConversationId}`);
                // TODO: Implement unread count or notification logic here for messages in other conversations.
             }
        };

        // Handler for receiving confirmation of message sent by *this* user.
        const handleMessageSent = (sentMessage) => {
             console.log('Received messageSent confirmation via socket:', sentMessage);
             const messageConversationId = sentMessage?.conversation?._id || sentMessage?.conversation;
             // Check if the message belongs to the currently selected conversation.
             if (messageConversationId && messageConversationId === selectedConversationId) {
                 console.log(`Message sent successfully for selected convo (${selectedConversationId}). Adding.`);
                 setMessages(prevMessages => [...prevMessages, sentMessage]);
             } else {
                 console.warn(`Received messageSent for a conversation (${messageConversationId}) that is not currently selected.`);
                 // TODO: Consider updating the last message preview in the conversation list here.
             }
        };

         // Handler for realtime conversation deletion notification (Optional)
         // If the backend emits this event *after* a successful Socket.IO delete.
         const handleConversationDeletedRealtime = (convId) => {
             console.log(`Received conversationDeletedRealtime for conv ID: ${convId}`);
             // Remove the conversation from the local state list.
             setConversations(prevConvs => prevConvs.filter(conv => conv._id !== convId));
             // If the deleted conversation was the selected one, clear selected state.
             if (selectedConversationId === convId) {
                 setSelectedConversationId(null);
                 setSelectedConversationName('');
                 setMessages([]);
             }
              // TODO: Optionally show a user notification.
         };


        // Set up the listeners on the socket instance.
        socket.on('receiveMessage', handleReceiveMessage);
        socket.on('messageSent', handleMessageSent); // Listener Setup
        socket.on('conversationDeleted', handleConversationDeletedRealtime); // Listener for deletion event from backend (based on your server code)


        // Cleanup function to remove listeners when the effect re-runs or component unmounts.
        return () => {
            if (socket) {
                console.log(`Cleaning up Socket.IO listeners.`);
                socket.off('receiveMessage', handleReceiveMessage);
                socket.off('messageSent', handleMessageSent);
                socket.off('conversationDeleted', handleConversationDeletedRealtime);
            }
        };

    }, [socket, isConnected, selectedConversationId]); // Dependency array includes socket, connection status, and selected conversation ID.


    // --- Event Handlers ---

    // Helper function to get display name and role/title for another participant in a conversation.
     const getOtherParticipantInfo = useCallback((participants = []) => {
        if (!currentUser?._id) return { name: "Loading...", title: '', role: '', id: null };
        const other = participants.find(p => p?._id && p._id !== currentUser._id);
        if (!other || !other.firstName) {
             console.warn("Participant info incomplete:", participants);
             return { name: 'User', title: '', role: '', id: other?._id || null };
        }
        const name = `${other.firstName || ''} ${other.lastName || ''}`.trim() || 'Unknown User';
        const title = other.role === 'doctor' ? 'Dr.' : '';
        return { name, title, role: other.role, id: other._id };
    }, [currentUser]); // Dependency array includes currentUser.

    // Handle selecting a conversation from the conversation list sidebar.
    const handleSelectConversation = useCallback((conversation) => {
        if (!conversation?._id || conversation._id === selectedConversationId) return;

        const otherInfo = getOtherParticipantInfo(conversation.participants);
        setSelectedConversationId(conversation._id);
        setSelectedConversationName(`${otherInfo.title} ${otherInfo.name}`.trim());
        setSelectedConversation(conversation);
        fetchMessagesForConversation(conversation._id);

        if (window.innerWidth < 992) { setIsConvSidebarOpen(false); }
    }, [getOtherParticipantInfo, fetchMessagesForConversation, selectedConversationId]);

    // Handle opening the "Start New Chat" modal.
    const openNewChatModal = () => {
        setSearchTerm('');
        loadPotentialRecipients(); // Fetch potential recipients.
        setIsNewChatModalOpen(true); // Show the modal.
    };

    // Handle closing the "Start New Chat" modal.
    const closeNewChatModal = () => {
        setIsNewChatModalOpen(false);
        setPotentialRecipients([]);
        setErrorRecipients('');
    };

    // Handle starting a new chat with a selected recipient from the modal.
    const handleStartNewChat = async (recipient) => {
        if (!recipient?._id) return;
        setErrorConversations(''); setErrorRecipients('');
        try {
            const conversation = await chatService.findOrCreateConversation(recipient._id); // Use chatService
            closeNewChatModal();
            setConversations(prev => {
                const exists = prev.some(c => c._id === conversation._id);
                const updatedConvs = exists ? prev : [conversation, ...prev];
                 // Optional: Sort updatedConvs by updatedAt if needed.
                return updatedConvs;
            });
            handleSelectConversation(conversation); // Select the new/found conversation to display messages.
        } catch (error) {
            setErrorRecipients(error.message || "Could not start chat.");
            console.error(error);
        }
    };

    // Filter potential recipients for the modal search input.
    const filteredRecipients = useMemo(() => {
        if (!Array.isArray(potentialRecipients)) return [];
        return potentialRecipients.filter(user => {
            const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim().toLowerCase();
            const userEmail = (user?.email || '').toLowerCase();
            const lowerSearchTerm = searchTerm.toLowerCase();
            return fullName.includes(lowerSearchTerm) || userEmail.includes(lowerSearchTerm);
        });
    }, [potentialRecipients, searchTerm]);


    // Calculate the recipient ID for the MessageInput component.
    const recipientId = useMemo(() => {
        if (!selectedConversation || !currentUser?._id || !Array.isArray(selectedConversation.participants)) {
            return null;
        }
        const otherParticipant = selectedConversation.participants.find(p => p?._id && p._id !== currentUser._id);
        return otherParticipant?._id || null;
    }, [selectedConversation, currentUser]);

    // Toggle conversation sidebar visibility.
    const toggleConvSidebar = () => { setIsConvSidebarOpen(!isConvSidebarOpen); };

    // *** Handler to show the delete confirmation modal (replaces window.confirm) ***
    // This function is called when the delete button is clicked in the conversation list item.
    const handleShowDeleteModal = (e, convId, convName) => {
        e.stopPropagation(); // Prevent click on list item
        // Set the state variables to show the modal and store the conversation details for deletion.
        setDeleteModalConvId(convId); // Store conversation ID for deletion
        setDeleteModalConvName(convName); // Store conversation name for message
        setShowDeleteConfirmModal(true); // Show the modal
    };

    // *** Handler for modal OK button (confirms deletion) ***
    // This function is called when the user clicks "OK" in the delete confirmation modal.
    const handleConfirmDeleteModal = async () => {
         if (!deleteModalConvId) return; // Guard against calling without a conversation ID.

         setShowDeleteConfirmModal(false); // Close the modal immediately
         setErrorConversations(''); // Clear list error message


         try {
             if (socket && socket.connected) {
                socket.emit("deleteConversation", deleteModalConvId);
                console.log(`Emitted 'deleteConversation' via socket for conv ID: ${deleteModalConvId}`);

                 // Update the local conversations state to remove the deleted conversation from the list instantly.
                 // This state update logic is correct for removing the conversation from the list instantly on the sender side
                 setConversations((prevConvs) =>
                     prevConvs.filter((conv) => conv._id !== deleteModalConvId)
                 );
                  // If the deleted conversation was the selected one, clear selected state.
                 if (selectedConversationId === deleteModalConvId) {
                     setSelectedConversationId(null);
                     setSelectedConversationName('');
                     setMessages([]);
                 }
                 // Note: The backend Socket.IO listener for 'deleteConversation' should handle DB deletion and notify the other participant.

             } else {
                 console.error("Socket not connected. Cannot emit deleteConversation.");
                 // Display an error message if the socket is not connected
                 setErrorConversations('Failed to delete chat: Socket not connected.');
             }


         } catch (error) {
             console.error(`Error deleting conversation ${deleteModalConvId} via Socket.IO:`, error); // Log the error details.
             // Display an error message (e.g., above the conversation list)
             setErrorConversations(error.message || 'Failed to delete chat.');
         } finally {
             // Clear modal state
             setDeleteModalConvId(null);
             setDeleteModalConvName('');
             // Optional: Clear loading state if you added one.
         }
    };

    // *** Handler for modal Cancel button (aborts deletion) ***
    // This function is called when the user clicks "Cancel" in the delete confirmation modal or closes the modal.
    const handleCancelDeleteModal = () => {
        console.log("Delete conversation action aborted by user.");
        // Clear modal state variables and close the modal.
        setShowDeleteConfirmModal(false);
        setDeleteModalConvId(null);
        setDeleteModalConvName('');
    };


    // Navigation handler for the "Back to Dashboard" button.
    const handleBackToDashboard = () => {
        navigate('/dashboard');  // Navigate to the dashboard (adjust path if doctor needs different dashboard).
    };


    // --- JSX Rendering ---
    return (
        <div className="chat-page-container"> {/* Main container for the chat page. */}

            {/* --- Conversation Sidebar --- */}
            <div className={`chat-sidebar ${isConvSidebarOpen ? "open" : "closed"}`}>
                 <div className="chat-sidebar-header">
                     {isConvSidebarOpen && <h2>Conversations</h2>}

                     <button onClick={isConvSidebarOpen ? openNewChatModal : toggleConvSidebar} className={`new-chat-button ${!isConvSidebarOpen ? 'sidebar-toggle-button' : ''}`} title={isConvSidebarOpen ? "Start New Chat" : "Open Conversations"}>
                         <FaPlus />
                    </button>

                     {/* Button to close the sidebar (shown when sidebar is open). */}
                     {isConvSidebarOpen && (
                         <button
                             className="sidebar-close-toggle"
                             onClick={toggleConvSidebar} // Calls the toggleConvSidebar handler.
                             title="Close Conversations"
                         >
                             <FaChevronLeft />
                         </button>
                     )}
                 </div>

                 {/* Conversation list area - shown only when sidebar is open. */}
                 {isConvSidebarOpen && (
                     <div className="conversation-list">
                        {isLoadingConversations && <p>Loading chats...</p>}
                        {errorConversations && <p className="error-message">{errorConversations}</p>}
                        {!isLoadingConversations && Array.isArray(conversations) && conversations.length === 0 && !errorConversations && (<p>No conversations yet.</p>)}
                        {!isLoadingConversations && Array.isArray(conversations) && conversations.length > 0 && (
                            <ul>
                                {conversations.map(conv => {
                                    if (!conv?._id || !Array.isArray(conv.participants)) {
                                        console.warn("Skipping rendering invalid conversation object:", conv);
                                        return null;
                                    }
                                    const otherInfo = getOtherParticipantInfo(conv.participants);
                                     if (!otherInfo || !otherInfo.id) {
                                         console.warn(`Could not get valid participant info for conv ${conv._id}, skipping render.`);
                                         return <li key={conv._id} className="conversation-item error">Conversation Error</li>;
                                     }
                                    const displayName = `${otherInfo.title} ${otherInfo.name}`.trim();

                                    return (
                                        // Keeping the delete button as it was provided, now it SHOWS the modal
                                        <li key={conv._id} className={`conversation-item ${selectedConversationId === conv._id ? 'selected' : ''}`} onClick={() => handleSelectConversation(conv)}>
                                            <span className="participant-name">{displayName || 'Unknown User'}</span>
                                             {/* Optional: Display last message preview */}
                                             {conv.lastMessage && conv.lastMessage.content && (
                                                 <p className="last-message-preview">{conv.lastMessage.content.substring(0, 50)}{conv.lastMessage.content.length > 50 ? '...' : ''}</p>
                                             )}


                                            <button
                                                className="delete-conversation-btn"
                                                title={`Delete chat with ${displayName || 'Unknown User'}`}
                                                // *** Modified onClick to show the modal ***
                                                onClick={(e) => handleShowDeleteModal(e, conv._id, displayName || 'Unknown User')}
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                                   {/* Back Button at the bottom of the sidebar */}
                            <div className="back-button-container">
                                <button onClick={handleBackToDashboard} className="back-to-dashboard-btn">
                                    <FaArrowLeft /> Back to Dashboard
                                </button>
                            </div>
                     </div>
                 )}
            </div>

            {/* --- Main Chat Area --- */}
            <div className={`chat-main-area ${isConvSidebarOpen ? "open" : "closed"}`}>
                {selectedConversationId ? (
                    <>
                        <div className="chat-header"><h3>{selectedConversationName || 'Chat'}</h3></div>
                        {/* MessageList Component: Displays messages. Pass currentUser for sender identification in UI. */}
                        <MessageList messages={messages} currentUser={currentUser} isLoading={isLoadingMessages} error={errorMessages} />
                        {/* MessageInput Component: Provides the text input and send button.
                            It needs the conversation ID and recipient ID to send messages. */}
                        {/* Pass socket prop so MessageInput can emit sendMessage */}
                        {/* Ensure conversationId and recipientId are valid before rendering MessageInput */}
                        {(selectedConversationId && recipientId && socket) ? (
                            // *** Pass the socket instance to MessageInput ***
                            // **Ensure MessageInput uses the socket prop to emit sendMessage**
                            <MessageInput conversationId={selectedConversationId} recipientId={recipientId} socket={socket} />
                        ) : (
                             <div className="message-input-placeholder">Cannot send message (issue with chat setup)</div> // Placeholder if input cannot be rendered
                        )}


                    </>
                ) : (
                    <div className="chat-placeholder"><h2>Select or start a conversation</h2></div>
                )}
            </div>

             {/* --- "Start New Chat" Modal --- */}
            <Modal isOpen={isNewChatModalOpen} onClose={closeNewChatModal} title={`Start New Chat ${currentUser?.role === 'patient' ? 'with a Doctor' : 'with a Patient'}`}>
               <div className="new-chat-modal-content">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="recipient-search-input" />
                    {isLoadingRecipients && <p>Loading...</p>}
                    {errorRecipients && <p className="error-message">{errorRecipients}</p>}
                    <ul className="recipient-list">
                        {!isLoadingRecipients && filteredRecipients.length === 0 && !errorRecipients && ( <li>No users found.</li> )}
                        {!isLoadingRecipients && filteredRecipients.map(user => (
                            <li key={user._id} onClick={() => handleStartNewChat(user)}>
                                {user.firstName} {user.lastName}
                                ({user.role === 'doctor' ? 'Dr.' : 'Patient'})
                                <span className="user-email"> - {user.email}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </Modal>

            {/* *** Custom Delete Confirmation Modal for Chat Conversations *** */}
            {/* Render this modal based on showDeleteConfirmModal state */}
            {/* Need to import Modal component if it's not already imported */}
            <Modal
                isOpen={showDeleteConfirmModal} // Controls modal visibility
                onClose={handleCancelDeleteModal} // Close handler
                title={`Delete Conversation`} // Title for the modal
            >
                {/* Modal Body Content: Confirmation Message and Action Buttons */}
                <p>Are you sure you want to delete the chat with {deleteModalConvName}? This action cannot be undone.</p> {/* Use stored name */}
                 {/* Div containing the OK and Cancel buttons for the modal */}
                 <div className="modal-buttons-manage">
                     {/* OK button - confirms the deletion */}
                     {/* Calls handleConfirmDeleteModal on click */}
                     {/* Assuming my-confirm-button class exists and is styled */}
                     <button className="my-confirm-button" onClick={handleConfirmDeleteModal}>OK</button>
                     {/* Cancel button - cancels the deletion */}
                     {/* Calls handleCancelDeleteModal on click */}
\                     <button className="my-cancel-button" onClick={handleCancelDeleteModal}>Cancel</button>
                 </div>
            </Modal>

        </div>
    );
};

export default Chat;