import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_SERVER_URL = 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(SOCKET_SERVER_URL);
    setSocket(socketInstance);

    // Setup listener
    socketInstance.emit('setup', user);

    socketInstance.on('connected', () => {
      console.log('🔌 Connected to ChatSphere WebSocket Gateway!');
    });

    socketInstance.on('user_online', (userId) => {
      setOnlineUsers((prev) => {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      });
    });

    socketInstance.on('user_offline', (userId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Clean up
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, setOnlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
