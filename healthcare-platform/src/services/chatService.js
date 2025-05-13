// src/services/chatService.js
import API from "./api"; 

/**
 * Fetches all conversations for the logged-in user.
 * Endpoint: GET /api/chat
 * @returns {Promise<Array>} A promise that resolves to an array of conversation objects.
 */
export const getConversations = async () => {
    try {
        const response = await API.get('/api/chat');
        // Ensure we return an array, even if the API response is unexpected
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("Error fetching conversations:", error.response?.data || error.message);
        // Re-throw error or return empty array depending on how you want calling components to handle it
        // Returning empty array might prevent crashes in UI mapping, but hides the error
        // throw error.response?.data || new Error("Failed to fetch conversations");
        return []; // Or re-throw as above
    }
};

/**
 * Fetches messages for a specific conversation with pagination.
 * Endpoint: GET /api/chat/:conversationId/messages?page=X&limit=Y
 * @param {string} conversationId - The ID of the conversation.
 * @param {number} [page=1] - The page number to fetch.
 * @param {number} [limit=30] - The number of messages per page.
 * @returns {Promise<Object>} A promise resolving to { messages: [], currentPage: number, totalPages: number, totalMessages: number }
 */
export const getMessages = async (conversationId, page = 1, limit = 30) => {
    if (!conversationId) {
         console.error("getMessages called without conversationId");
         // Return a default structure or throw error
         return { messages: [], currentPage: 1, totalPages: 0, totalMessages: 0 };
         // throw new Error("Conversation ID is required to fetch messages.");
    }
    try {
        const response = await API.get(`/api/chat/${conversationId}/messages`, {
            params: { page, limit } // Pass pagination params
        });
        // Validate response structure before returning
        if (response.data && Array.isArray(response.data.messages)) {
            return response.data;
        } else {
            console.warn("Received unexpected data structure for messages:", response.data);
            return { messages: [], currentPage: 1, totalPages: 0, totalMessages: 0 }; // Return default structure
        }
    } catch (error) {
        console.error(`Error fetching messages for conversation ${conversationId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error("Failed to fetch messages");
    }
};

/**
 * Finds an existing 1-on-1 conversation or creates a new one.
 * Endpoint: POST /api/chat/findOrCreate
 * @param {string} recipientId - The ID of the other user to chat with.
 * @returns {Promise<Object>} A promise resolving to the conversation object.
 */
export const findOrCreateConversation = async (recipientId) => {
     if (!recipientId) {
         throw new Error("Recipient ID is required to find or create conversation.");
    }
    try {
        const response = await API.post('/api/chat/findOrCreate', { recipientId });
        return response.data; // Returns the found or newly created conversation object
    } catch (error) {
        console.error(`Error finding/creating conversation with ${recipientId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error("Failed to initiate conversation");
    }
};