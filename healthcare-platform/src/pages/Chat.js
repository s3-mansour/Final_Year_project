import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// Services
import * as chatService from '../services/chatService';
import { getUserProfile, logoutUser } from '../services/authService';
import { getConsultantsList } from '../services/userService';
import { getPatientsList } from '../services/consultantService';
// Components
import Modal from '../components/Modal';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
// Context Hook
import { useSocket } from '../context/SocketContext';
// Icons
import { FaPlus, FaTrashAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
// Styles
import './styles/Chat.css';

// Helper to format date/time display
const formatDateTimeDisplay = (dateString) => {
    if (!dateString) return '';
    try { return new Date(dateString).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return 'Invalid Date'; }
};

const Chat = () => {
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();

    // --- State ---
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [errorConversations, setErrorConversations] = useState('');
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [selectedConversationName, setSelectedConversationName] = useState('');
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [errorMessages, setErrorMessages] = useState('');
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [potentialRecipients, setPotentialRecipients] = useState([]);
    const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
    const [errorRecipients, setErrorRecipients] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isConvSidebarOpen, setIsConvSidebarOpen] = useState(true);

    // --- Effects ---
    // Fetch initial data (user profile & conversations)
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            setIsLoadingConversations(true); setErrorConversations(''); setCurrentUser(null); setConversations([]);
            try {
                const profileData = await getUserProfile();
                if (!isMounted) return;
                setCurrentUser(profileData);
                if (profileData?._id) {
                    const convData = await chatService.getConversations();
                    if (!isMounted) return;
                    setConversations(Array.isArray(convData) ? convData : []);
                } else { throw new Error("Failed to load user profile."); }
            } catch (error) {
                if (isMounted) { console.error("Chat initial data error:", error); setErrorConversations(error.message || 'Failed load.'); setConversations([]); setCurrentUser(null); if (error.message.toLowerCase().includes('unauthorized') || error?.response?.status === 401) { logoutUser(); navigate('/login', {replace: true}); } }
            } finally { if (isMounted) { setIsLoadingConversations(false); } }
        };
        loadInitialData();
        return () => { isMounted = false; };
    }, [navigate]); // Only depends on navigate

    // Fetch potential recipients for new chat modal
    const loadPotentialRecipients = useCallback(async () => {
        if (!currentUser?._id || !currentUser?.role) return;
        setIsLoadingRecipients(true); setErrorRecipients(''); setPotentialRecipients([]);
        try {
            let data;
            if (currentUser.role === 'patient') { data = await getConsultantsList(); }
            else if (currentUser.role === 'doctor') { data = await getPatientsList(); }
            else { throw new Error("User role cannot initiate chats."); }
            const filteredData = Array.isArray(data) ? data.filter(user => user._id !== currentUser._id) : [];
            setPotentialRecipients(filteredData);
        } catch (error) { console.error("Error fetching recipients:", error); setErrorRecipients(error.message || 'Failed.'); setPotentialRecipients([]); }
        finally { setIsLoadingRecipients(false); }
    }, [currentUser]);

    // Fetch messages for selected conversation
     const fetchMessagesForConversation = useCallback(async (convId) => {
        if (!convId) return;
        setErrorMessages(''); setMessages([]); setIsLoadingMessages(true);
        try {
            const messageData = await chatService.getMessages(convId);
            if (messageData && Array.isArray(messageData.messages)) { setMessages(messageData.messages); }
            else { setMessages([]); }
        } catch (error) { setErrorMessages(error.message || "Failed."); setMessages([]); console.error(error); }
        finally { setIsLoadingMessages(false); }
    }, []);

    // --- Real-time Message Handling (Socket.IO Listener) ---
    useEffect(() => {
        if (!socket || !isConnected) { console.log("Socket not ready for message listener."); return; }
        const handleReceiveMessage = (newMessage) => {
            console.log('Received message via socket:', newMessage);
            const messageConversationId = newMessage?.conversation?._id || newMessage?.conversation;
            if (!messageConversationId) { console.error("Received msg missing conversation ID"); return; }
            if (messageConversationId === selectedConversationId) {
                console.log(`Msg for selected convo (${selectedConversationId}). Adding.`);
                setMessages(prevMessages => [...prevMessages, newMessage]);
            } else { console.log(`Msg for different convo: ${messageConversationId}`); /* TODO: Unread count */ }
        };
        console.log(`Setting up 'receiveMessage' listener (Socket ID: ${socket.id})`);
        socket.on('receiveMessage', handleReceiveMessage);
        return () => { if (socket) { console.log(`Cleaning up 'receiveMessage' listener`); socket.off('receiveMessage', handleReceiveMessage); } };
    }, [socket, isConnected, selectedConversationId]);

    // --- Event Handlers ---

    // Get display name AND title/role of other participant(s)
     const getOtherParticipantInfo = useCallback((participants = []) => {
        if (!currentUser?._id) return { name: "Loading...", title: '', role: '', id: null };
        const other = participants.find(p => p?._id && p._id !== currentUser._id);
        // Handle case where participant data might be missing (e.g., only ID stored)
        if (!other || !other.firstName) {
             console.warn("Participant info incomplete:", participants);
             // You might need another API call here to fetch user details based on ID if not populated
             return { name: 'User', title: '', role: '', id: other?._id || null };
        }
        const name = `${other.firstName || ''} ${other.lastName || ''}`.trim() || 'Unknown User';
        const title = other.role === 'doctor' ? 'Dr.' : '';
        return { name, title, role: other.role, id: other._id };
    }, [currentUser]);

    // Handle selecting a conversation from the list
    const handleSelectConversation = useCallback((conversation) => {
        if (!conversation?._id || conversation._id === selectedConversationId) return;
        const otherInfo = getOtherParticipantInfo(conversation.participants);
        setSelectedConversationId(conversation._id);
        setSelectedConversationName(`${otherInfo.title} ${otherInfo.name}`.trim()); // Use title + name
        setSelectedConversation(conversation);
        fetchMessagesForConversation(conversation._id);
        if (window.innerWidth < 992) { setIsConvSidebarOpen(false); }
    }, [getOtherParticipantInfo, fetchMessagesForConversation, selectedConversationId]);

    // New Chat Modal
    const openNewChatModal = () => { setSearchTerm(''); loadPotentialRecipients(); setIsNewChatModalOpen(true); };
    const closeNewChatModal = () => { setIsNewChatModalOpen(false); setPotentialRecipients([]); setErrorRecipients(''); };
    const handleStartNewChat = async (recipient) => { if (!recipient?._id) return; setErrorConversations(''); setErrorRecipients(''); try { const conversation = await chatService.findOrCreateConversation(recipient._id); closeNewChatModal(); setConversations(prev => { const exists = prev.some(c => c._id === conversation._id); return exists ? prev : [conversation, ...prev]; }); handleSelectConversation(conversation); } catch (error) { setErrorRecipients(error.message || "Could not start chat."); console.error(error); }};

    // Filter recipients for modal search
    const filteredRecipients = potentialRecipients.filter(user => ((((user?.firstName || '') + ' ' + (user?.lastName || '')).toLowerCase().includes(searchTerm.toLowerCase())) || ((user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()))));

    // Calculate recipientId for the MessageInput component
    const recipientId = useMemo(() => { if (!selectedConversation || !currentUser?._id || !Array.isArray(selectedConversation.participants)) { return null; } const otherParticipant = selectedConversation.participants.find(p => p?._id && p._id !== currentUser._id); return otherParticipant?._id || null; }, [selectedConversation, currentUser]);

    // Toggle conversation sidebar
    const toggleConvSidebar = () => { setIsConvSidebarOpen(!isConvSidebarOpen); };

    // Placeholder for delete conversation
    const handleDeleteConversation = (e, convId, convName) => { e.stopPropagation(); if (window.confirm(`Delete chat with ${convName}?`)) { console.log("TODO: Implement delete conversation ID:", convId); /* API call -> update state */ } };

    // --- JSX Rendering ---
    return (
        <div className="chat-page-container">
            {/* --- Sidebar --- */}
            <div className={`chat-sidebar ${isConvSidebarOpen ? "open" : "closed"}`}>
                 <div className="chat-sidebar-header">
                     {isConvSidebarOpen && <h2>Conversations</h2>}
                     <button onClick={isConvSidebarOpen ? openNewChatModal : toggleConvSidebar} className={`new-chat-button ${!isConvSidebarOpen ? 'sidebar-toggle-button' : ''}`} title={isConvSidebarOpen ? "Start New Chat" : "Open Conversations"}>
                         {isConvSidebarOpen ? <FaPlus /> : <FaChevronRight />}
                    </button>
                     {isConvSidebarOpen && ( <button className="sidebar-close-toggle" onClick={toggleConvSidebar} title="Close Conversations"><FaChevronLeft /></button> )}
                 </div>
                 {isConvSidebarOpen && (
                     <div className="conversation-list">
                        {isLoadingConversations && <p>Loading chats...</p>}
                        {errorConversations && <p className="error-message">{errorConversations}</p>}
                        {!isLoadingConversations && Array.isArray(conversations) && conversations.length === 0 && !errorConversations && (<p>No conversations yet.</p>)}
                        {!isLoadingConversations && Array.isArray(conversations) && conversations.length > 0 && (
                            <ul>
                                {conversations.map(conv => {
                                    // Basic validation
                                    if (!conv?._id || !Array.isArray(conv.participants)) {
                                        console.warn("Skipping rendering invalid conversation object:", conv);
                                        return null;
                                    }
                                    // *** Call helper first ***
                                    const otherInfo = getOtherParticipantInfo(conv.participants);

                                    // *** Add safety check ***
                                     if (!otherInfo || !otherInfo.id) { // Check if we at least got an ID
                                         console.warn(`Could not get valid participant info for conv ${conv._id}, skipping render.`);
                                         return <li key={conv._id} className="conversation-item error">Conversation Error</li>; // Render placeholder on error
                                     }

                                    // *** Use calculated display name ***
                                    const displayName = `${otherInfo.title} ${otherInfo.name}`.trim();

                                    return (
                                        <li key={conv._id} className={`conversation-item ${selectedConversationId === conv._id ? 'selected' : ''}`} onClick={() => handleSelectConversation(conv)}>
                                            <span className="participant-name">{displayName || 'Unknown User'}</span> {/* Fallback for name */}
                                            <button
                                                className="delete-conversation-btn"
                                                title={`Delete chat with ${displayName || 'Unknown User'}`}
                                                onClick={(e) => handleDeleteConversation(e, conv._id, displayName || 'Unknown User')}
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </li> );
                                })}
                            </ul>
                        )}
                     </div>
                 )}
            </div>

            {/* --- Main Chat Area --- */}
            <div className={`chat-main-area ${isConvSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
                {selectedConversationId ? (
                    <>
                        <div className="chat-header"><h3>{selectedConversationName || 'Chat'}</h3></div>
                        {/* MessageList Component */}
                        <MessageList messages={messages} currentUser={currentUser} isLoading={isLoadingMessages} error={errorMessages} />
                        {/* MessageInput Component */}
                        <MessageInput conversationId={selectedConversationId} recipientId={recipientId} />
                    </>
                ) : ( <div className="chat-placeholder"><h2>Select or start a conversation</h2></div> )}
            </div>

             {/* --- New Chat Modal --- */}
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
                            </li> ))}
                    </ul>
                </div>
            </Modal>
        </div>
    );
};

export default Chat;