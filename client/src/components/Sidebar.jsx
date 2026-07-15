import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Search, Plus, Users, LogOut, Settings, User as UserIcon, Loader2, X, Check, Circle, Shuffle, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeChat, setActiveChat, chats, setChats, fetchChats }) => {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();

  // Search profiles state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Group modal state
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
  const [groupCreateLoading, setGroupCreateLoading] = useState(false);

  // Matchmaking states
  const [matchingOpen, setMatchingOpen] = useState(false);

  const handleJoinRandomQueue = () => {
    if (!socket) return;
    setMatchingOpen(true);
    socket.emit('join_random_queue', user._id);
  };

  const handleCancelMatchmaking = () => {
    if (!socket) return;
    socket.emit('leave_random_queue', user._id);
    setMatchingOpen(false);
  };

  // Close matchmaking modal when matched
  useEffect(() => {
    if (!socket) return;
    socket.on('random_matched', (matchedChat) => {
      setMatchingOpen(false);
      
      // Auto focus and append to list
      setChats((prev) => {
        if (prev.some((c) => c._id === matchedChat._id)) return prev;
        return [matchedChat, ...prev];
      });
      setActiveChat(matchedChat);
      socket.emit('join_chat', matchedChat._id);
    });
    return () => {
      socket.off('random_matched');
    };
  }, [socket, setChats, setActiveChat]);


  // Chat typing indicators state map (chatId -> boolean)
  const [typingChats, setTypingChats] = useState({});

  useEffect(() => {
    if (!socket) return;

    socket.on('typing', (chatId) => {
      setTypingChats((prev) => ({ ...prev, [chatId]: true }));
    });

    socket.on('stop_typing', (chatId) => {
      setTypingChats((prev) => ({ ...prev, [chatId]: false }));
    });

    return () => {
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [socket]);

  // Search users API query
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const { data } = await axios.get(`/api/auth/users?search=${searchQuery}`);
        setSearchResults(data);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  // Handle starting a 1-to-1 chat
  const handleAccessChat = async (targetUserId) => {
    try {
      const { data } = await axios.post('/api/chats', { userId: targetUserId });
      
      // Add chat to the list if not already present
      setChats((prev) => {
        if (prev.some((c) => c._id === data._id)) return prev;
        return [data, ...prev];
      });

      setActiveChat(data);
      setSearchQuery('');
      setSearchResults([]);
      
      if (socket) {
        socket.emit('join_chat', data._id);
      }
    } catch (err) {
      console.error('Error accessing chat:', err);
    }
  };

  // Open group modal & load users for selection
  const handleOpenGroupModal = async () => {
    setGroupModalOpen(true);
    try {
      const { data } = await axios.get('/api/auth/users?search='); // Load all searchable users
      setAllUsersList(data);
    } catch (err) {
      console.error('Error loading users for group:', err);
    }
  };

  const handleStartAIChat = async () => {
    try {
      // Try Mock AI ID first
      const { data } = await axios.post('/api/chats', { userId: 'ai_bot_id_999' });
      setChats((prev) => {
        if (prev.some((c) => c._id === data._id)) return prev;
        return [data, ...prev];
      });
      setActiveChat(data);
      if (socket) socket.emit('join_chat', data._id);
    } catch (err) {
      try {
        // Fallback to Mongo AI ID
        const { data } = await axios.post('/api/chats', { userId: '64ae99999999999999999999' });
        setChats((prev) => {
          if (prev.some((c) => c._id === data._id)) return prev;
          return [data, ...prev];
        });
        setActiveChat(data);
        if (socket) socket.emit('join_chat', data._id);
      } catch (err2) {
        console.error('Failed to start AI chat:', err2);
      }
    }
  };


  const handleToggleMember = (userId) => {
    setSelectedMembers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length < 2) {
      alert('Group chats require a name and at least 2 other members');
      return;
    }

    setGroupCreateLoading(true);
    try {
      const { data } = await axios.post('/api/groups/create', {
        chatName: groupName,
        users: selectedMembers,
      });

      setChats((prev) => [data, ...prev]);
      setActiveChat(data);
      setGroupName('');
      setSelectedMembers([]);
      setGroupModalOpen(false);

      if (socket) {
        socket.emit('join_chat', data._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Group creation failed');
    } finally {
      setGroupCreateLoading(false);
    }
  };

  const getChatDetails = (chat) => {
    if (chat.isGroupChat) {
      return {
        name: chat.chatName,
        photo: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&q=80',
        isOnline: false,
      };
    }
    
    // 1-to-1 chat. Find the other member.
    const otherMember = chat.members?.find((m) => m._id !== user._id);
    const otherMemberId = otherMember?._id || '';

    return {
      name: otherMember?.name || 'Deleted User',
      photo: otherMember?.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      isOnline: onlineUsers.includes(otherMemberId) || otherMember?.status === 'online',
    };
  };

  return (
    <div className="w-full md:w-80 flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-800/60 overflow-hidden relative">
      
      {/* Sidebar Top Profile header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src={user?.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
            alt={user?.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-500/25"
          />
          <span className="font-extrabold text-sm text-gray-900 dark:text-white truncate max-w-[100px]">
            {user?.name}
          </span>
        </div>
        
        {/* Navigation Action icons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleStartAIChat}
            className="p-2 text-gray-500 hover:text-violet-650 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Chat with AI Assistant"
          >
            <Cpu className="w-4.5 h-4.5 animate-pulse text-violet-500" />
          </button>
          <button
            onClick={handleJoinRandomQueue}
            className="p-2 text-gray-500 hover:text-violet-650 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Chat with Random Stranger"
          >
            <Shuffle className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleOpenGroupModal}
            className="p-2 text-gray-500 hover:text-violet-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Create New Group"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="p-2 text-gray-500 hover:text-violet-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Edit Profile"
          >
            <UserIcon className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-gray-500 hover:text-violet-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 rounded-xl transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* User Search Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users to chat..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 text-xs focus:ring-1 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Lists area */}
      <div className="flex-grow overflow-y-auto px-2 pb-4 space-y-1">
        
        {/* Search users list displays when query exists */}
        {searchQuery ? (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest pl-2 block mb-1">
              Search Results
            </span>
            {searchLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-[11px] text-gray-400 text-center py-4">No users found matching query</p>
            ) : (
              searchResults.map((usr) => (
                <button
                  key={usr._id}
                  onClick={() => handleAccessChat(usr._id)}
                  className="w-full flex items-center space-x-3 p-2.5 hover:bg-violet-50/50 dark:hover:bg-violet-950/10 rounded-xl transition-colors text-left"
                >
                  <img
                    src={usr.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={usr.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-300">{usr.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{usr.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          /* Active chat threads list */
          <div className="space-y-1">
            {chats.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-400 dark:text-gray-500">No active conversations yet.</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[150px] mx-auto">
                  Type a user name in the search box above to start chatting!
                </p>
              </div>
            ) : (
              chats.map((chat) => {
                const details = getChatDetails(chat);
                const isSelected = activeChat?._id === chat._id;
                const isTyping = typingChats[chat._id];

                return (
                  <button
                    key={chat._id}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-2xl transition-all duration-200 text-left border ${
                      isSelected
                        ? 'bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/30 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                  >
                    {/* Avatar with absolute green dot status */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={details.photo}
                        alt={details.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {details.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                      )}
                    </div>

                    {/* Chat Text Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className={`text-xs font-bold truncate max-w-[130px] ${
                          isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {details.name}
                        </h4>
                        
                        {chat.lastMessage && (
                          <span className="text-[9px] text-gray-400">
                            {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Last Message text preview or Typing... status */}
                      {isTyping ? (
                        <p className="text-[10px] text-violet-500 font-bold animate-pulse">Typing...</p>
                      ) : chat.lastMessage ? (
                        <p className="text-[10px] text-gray-400 dark:text-gray-400 truncate max-w-[160px] font-light">
                          <span className="font-semibold mr-1">
                            {chat.lastMessage.sender?._id === user._id ? 'You:' : `${chat.lastMessage.sender?.name}:`}
                          </span>
                          {chat.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-400 font-light italic">No messages yet</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MODAL: Create Group chat */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            onClick={() => setGroupModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          ></div>
          
          <form
            onSubmit={handleCreateGroupSubmit}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl relative z-10 max-w-sm w-full space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center">
                <Users className="w-4.5 h-4.5 mr-2 text-violet-500" />
                Create Group Chat
              </h3>
              <button
                type="button"
                onClick={() => setGroupModalOpen(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Input name */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Group Name</label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Developers Lounge"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-gray-800 dark:text-gray-200 text-xs focus:ring-1 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
              />
            </div>

            {/* Select members list */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Select Members (Min 2)
              </label>
              <div className="h-44 border border-gray-200 dark:border-gray-800 rounded-xl overflow-y-auto p-2 space-y-1 bg-gray-50/50 dark:bg-gray-950/20">
                {allUsersList.length === 0 ? (
                  <p className="text-[10px] text-gray-400 text-center py-8">No members available to add</p>
                ) : (
                  allUsersList.map((usr) => {
                    const isChecked = selectedMembers.includes(usr._id);
                    return (
                      <button
                        type="button"
                        key={usr._id}
                        onClick={() => handleToggleMember(usr._id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          isChecked
                            ? 'bg-violet-50/50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <img
                            src={usr.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                            alt={usr.name}
                            className="w-6.5 h-6.5 rounded-full object-cover"
                          />
                          <span className="text-[11px] font-semibold truncate max-w-[160px]">{usr.name}</span>
                        </div>
                        {isChecked ? (
                          <div className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center shadow">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-700"></div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={groupCreateLoading || selectedMembers.length < 2 || !groupName.trim()}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center"
            >
              {groupCreateLoading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin mr-1.5" />
              ) : null}
              Create Group Chat
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Matchmaking overlay */}
      {matchingOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            onClick={handleCancelMatchmaking}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          ></div>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl relative z-10 max-w-xs w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto animate-pulse">
              <Shuffle className="w-6 h-6 animate-spin" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Finding a Stranger</h3>
              <p className="text-[10px] text-gray-400">Waiting in the matchmaking queue...</p>
            </div>

            <button
              type="button"
              onClick={handleCancelMatchmaking}
              className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-colors"
            >
              Cancel Matchmaking
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Sidebar;
