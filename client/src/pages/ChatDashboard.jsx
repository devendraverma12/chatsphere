import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ChevronLeft } from 'lucide-react';

const ChatDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all chats
  const fetchChats = async () => {
    try {
      const { data } = await axios.get('/api/chats');
      setChats(data);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user]);

  // Handle incoming socket message relays to update sidebar previews globally
  useEffect(() => {
    if (!socket) return;

    socket.on('message_received', (newMsg) => {
      // Re-fetch or update chat lastMessage in state list
      fetchChats();
    });

    socket.on('message_seen', () => {
      fetchChats();
    });

    return () => {
      socket.off('message_received');
      socket.off('message_seen');
    };
  }, [socket]);

  return (
    <div className="h-screen w-screen flex bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors">
      
      {/* Sidebar - Hidden on mobile if a chat is active */}
      <div className={`h-full w-full md:w-80 flex-shrink-0 ${activeChat ? 'hidden md:block' : 'block'}`}>
        <Sidebar
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          chats={chats}
          setChats={setChats}
          fetchChats={fetchChats}
        />
      </div>

      {/* Chat Area - Full screen on mobile if active, else hidden */}
      <div className={`h-full flex-grow flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat && (
          // Mobile header back-button wrapper
          <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 flex items-center">
            <button
              onClick={() => setActiveChat(null)}
              className="p-1 text-gray-500 hover:text-violet-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-gray-800 rounded-xl transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-2">Back to Chats</span>
          </div>
        )}
        <ChatArea
          activeChat={activeChat}
          fetchChats={fetchChats}
        />
      </div>

    </div>
  );
};

export default ChatDashboard;
