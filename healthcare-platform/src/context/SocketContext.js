
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';

//  Create the Context
const SocketContext = createContext(null);

//  Create a custom hook to use the context easily
export const useSocket = () => {
  return useContext(SocketContext);
};

//  Create the Provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Attempt connection only when component mounts or potentially when auth changes
    console.log("SocketProvider: useEffect running");

    const token = localStorage.getItem("token"); // Get token from storage

    if (!token) {
        console.log("SocketProvider: No token found, socket not connecting.");
        // If socket was previously connected, disconnect it
        if (socket) {
             socket.disconnect();
             setSocket(null);
             setIsConnected(false);
             console.log("SocketProvider: Disconnected existing socket due to missing token.");
        }
        return; // Don't attempt connection without a token
    }

    // Prevent multiple connections if already connected
    if (socket?.connected) {
        console.log("SocketProvider: Socket already connected.");
        return;
    }

    console.log("SocketProvider: Attempting to connect...");
    // Establish connection - Use environment variable for URL
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
      // Send token for authentication via socketAuthMiddleware
      auth: {
        token: `Bearer ${token}` // Send with Bearer prefix (middleware expects it)
      },
 
    });

    // Event Listeners
    newSocket.on('connect', () => {
      console.log(`SocketProvider: Socket connected! ID: ${newSocket.id}`);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`SocketProvider: Socket disconnected. Reason: ${reason}`);
      setIsConnected(false);
      // Handle potential need for reconnection attempts depending on the reason
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        // newSocket.connect(); // Or implement more robust reconnection logic
      } else if (reason === 'io client disconnect') {
           console.log("Socket disconnected by client call.");
      } else {
           console.log("Socket disconnected potentially due to network or auth issue.");
           // Maybe clear token if disconnect seems auth related? Handle carefully.
      }
    });

    newSocket.on('connect_error', (err) => {
      // Handle connection errors (e.g., server down, CORS issue, auth failure)
      console.error(`SocketProvider: Connection Error - ${err.message}`);
      // Check if the error is due to authentication failure from our middleware
      if (err.message.includes("Authentication error")) {
          console.error("Authentication failed. Check token or backend middleware.");
       
      }
      setIsConnected(false);
    });

    // Listen for custom 'connected' event from server (optional)
    newSocket.on('connected', (data) => {
        console.log("SocketProvider: Received 'connected' event from server:", data.message);
    });


    setSocket(newSocket); // Store the socket instance in state

    // Cleanup on component unmount or if token changes causing re-run
    return () => {
      console.log("SocketProvider: Cleanup - disconnecting socket.");
      newSocket.disconnect();
      setIsConnected(false);
      setSocket(null); // Clear socket from state
    };

  }, []); // Run once on mount initially

  // Use useMemo to prevent unnecessary re-renders of consumers when socket instance doesn't change
  const contextValue = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};