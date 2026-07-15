import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Phone, Video, Send, Paperclip, Smile, Search, MoreVertical, Edit2, Trash2, Shield, UserMinus, UserPlus, LogOut, Check, CheckCheck, Loader2, X } from 'lucide-react';

const EMOJIS = ['😀', '😂', '🤣', '😍', '👍', '🔥', '🎉', '👏', '🙏', '❤️', '🤔', '😎', '💡', '🌟', '👀', '💯'];

const ChatArea = ({ activeChat, fetchChats }) => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  
  // Message search filters
  const [searchOpen, setSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');

  // Sockets states
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);

  // Emojis panel open
  const [emojiOpen, setEmojiOpen] = useState(false);

  // Group Details Modal
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [groupActionLoading, setGroupActionLoading] = useState(false);

  // File Upload states
  const [uploadingFile, setUploadingFile] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Join socket room when activeChat changes
  useEffect(() => {
    if (socket && activeChat) {
      socket.emit('join_chat', activeChat._id);
    }
  }, [socket, activeChat]);

  // Fetch messages on chat change
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) return;
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/chats/${activeChat._id}/messages`);
        setMessages(data);
        scrollToBottom();

        // Emit seen event
        if (socket && data.length > 0) {
          const lastMsg = data[data.length - 1];
          socket.emit('seen_message', {
            chatId: activeChat._id,
            userId: user._id,
            messageId: lastMsg._id,
          });
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    setPeerTyping(false);
    setSearchOpen(false);
    setMessageSearchQuery('');
  }, [activeChat]);

  // Sockets Event Listeners for incoming messages, seen receipts, typing signals
  useEffect(() => {
    if (!socket || !activeChat) return;

    socket.on('message_received', (newMsg) => {
      const msgChatId = newMsg.chat?._id || newMsg.chat;
      if (msgChatId === activeChat._id) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();

        // Emit seen receipt
        socket.emit('seen_message', {
          chatId: activeChat._id,
          userId: user._id,
          messageId: newMsg._id,
        });
      }
    });

    socket.on('message_seen', ({ chatId, userId, messageId }) => {
      if (chatId === activeChat._id) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg._id === messageId || new Date(msg.createdAt) <= new Date()) {
              if (!msg.seenBy.includes(userId)) {
                return { ...msg, seenBy: [...msg.seenBy, userId] };
              }
            }
            return msg;
          })
        );
      }
    });

    socket.on('typing', (chatId) => {
      if (chatId === activeChat._id) {
        setPeerTyping(true);
      }
    });

    socket.on('stop_typing', (chatId) => {
      if (chatId === activeChat._id) {
        setPeerTyping(false);
      }
    });

    return () => {
      socket.off('message_received');
      socket.off('message_seen');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [socket, activeChat, user]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Typing indicator triggers
  const handleTextChange = (e) => {
    setText(e.target.value);

    if (!socket || !activeChat) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', activeChat._id);
    }

    // Debounce stop typing signal
    const lastTypingTime = new Date().getTime();
    const timerLength = 2000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && isTyping) {
        socket.emit('stop_typing', activeChat._id);
        setIsTyping(false);
      }
    }, timerLength);
  };

  // Submit Text Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const messageContent = text;
    setText('');
    setEmojiOpen(false);

    if (socket && activeChat) {
      socket.emit('stop_typing', activeChat._id);
      setIsTyping(false);
    }

    try {
      const { data } = await axios.post('/api/chats/messages', {
        chatId: activeChat._id,
        content: messageContent,
      });

      setMessages((prev) => [...prev, data]);
      scrollToBottom();
      fetchChats(); // Update sidebar preview

      if (socket) {
        socket.emit('new_message', data);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // File picker attachment upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setUploadingFile(true);
    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
      };

      const res = await axios.post('/api/upload', data, config);
      const isImg = file.type.startsWith('image/');

      const msgRes = await axios.post('/api/chats/messages', {
        chatId: activeChat._id,
        content: `Sent a file: ${file.name}`,
        messageType: isImg ? 'image' : 'file',
        fileUrl: res.data.url,
      });

      setMessages((prev) => [...prev, msgRes.data]);
      scrollToBottom();
      fetchChats();

      if (socket) {
        socket.emit('new_message', msgRes.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleEditMessage = async (msgId) => {
    if (!editText.trim()) return;
    try {
      const { data } = await axios.put(`/api/chats/messages/${msgId}`, {
        content: editText,
      });

      setMessages((prev) => prev.map((m) => (m._id === msgId ? data : m)));
      setEditingMessageId(null);
      setEditText('');
      fetchChats();

      if (socket) {
        socket.emit('new_message', data); // re-emit to update peers UI
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      const { data } = await axios.delete(`/api/chats/messages/${msgId}`);
      setMessages((prev) => prev.map((m) => (m._id === msgId ? data : m)));
      fetchChats();

      if (socket) {
        socket.emit('new_message', data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGroupRename = async (e) => {
    e.preventDefault();
    if (!groupNameInput.trim()) return;

    setGroupActionLoading(true);
    try {
      const { data } = await axios.put('/api/groups/rename', {
        chatId: activeChat._id,
        chatName: groupNameInput,
      });

      activeChat.chatName = data.chatName;
      setGroupNameInput('');
      fetchChats();
      alert('Group name updated.');
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleGroupAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberEmail.trim()) return;

    setGroupActionLoading(true);
    try {
      // Find user by email first
      const searchRes = await axios.get(`/api/auth/users?search=${addMemberEmail}`);
      const targetUser = searchRes.data.find(
        (u) => u.email.toLowerCase() === addMemberEmail.toLowerCase()
      );

      if (!targetUser) {
        alert('User with that email address not found');
        setGroupActionLoading(false);
        return;
      }

      const { data } = await axios.put('/api/groups/add', {
        chatId: activeChat._id,
        userId: targetUser._id,
      });

      activeChat.members = data.members;
      setAddMemberEmail('');
      alert(`Added member ${targetUser.name} successfully.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Addition failed');
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) return;

    setGroupActionLoading(true);
    try {
      const { data } = await axios.put('/api/groups/remove', {
        chatId: activeChat._id,
        userId: targetUserId,
      });

      activeChat.members = data.members;
      alert('Member removed successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Removal failed');
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    setGroupActionLoading(true);
    try {
      await axios.put('/api/groups/remove', {
        chatId: activeChat._id,
        userId: user._id,
      });

      setGroupModalOpen(false);
      activeChat.members = activeChat.members.filter((m) => m._id !== user._id);
      fetchChats();
      window.location.reload(); // Refresh dashboard
    } catch (err) {
      console.error(err);
    }
  };

  // Get recipient profile details (for header title display)
  const getRecipientInfo = () => {
    if (!activeChat) return null;
    if (activeChat.isGroupChat) {
      return {
        name: activeChat.chatName,
        photo: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&q=80',
        sub: `${activeChat.members?.length || 0} participants`,
        isOnline: false,
      };
    }

    const otherMember = activeChat.members?.find((m) => m._id !== user._id);
    const otherId = otherMember?._id || '';
    const isOnline = onlineUsers.includes(otherId) || otherMember?.status === 'online';

    return {
      name: otherMember?.name || 'Deleted Account',
      photo: otherMember?.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      sub: isOnline ? 'Online' : 'Offline',
      isOnline,
    };
  };

  // Filter messages by search query
  const filteredMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
  );

  const recipient = getRecipientInfo();

  if (!activeChat) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 transition-colors duration-300">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-violet-600/10">
            <MoreVertical className="w-8 h-8 rotate-90" />
          </div>
          <h2 className="text-lg font-black text-gray-800 dark:text-white">Start a Conversation</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
            Search for profile names in the sidebar panel to launch real-time messaging rooms, or start group chats with multiple members.
          </p>
        </div>
      </div>
    );
  }

  // Check if current user is group Admin
  const isGroupAdmin = activeChat.isGroupChat && activeChat.groupAdmin === user._id;

  return (
    <div className="flex-grow flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative overflow-hidden transition-colors">
      
      {/* Header bar */}
      <div className="px-6 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-800/60 flex items-center justify-between shadow-xs">
        
        {/* Recipient Details card */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={recipient.photo}
              alt={recipient.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {recipient.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
            )}
          </div>
          <div className="min-w-0 text-left">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
              {recipient.name}
            </h3>
            
            {peerTyping ? (
              <p className="text-[10px] text-violet-500 font-bold animate-pulse">typing...</p>
            ) : (
              <p className={`text-[9px] font-semibold ${
                recipient.sub === 'Online' ? 'text-emerald-500' : 'text-gray-400'
              }`}>
                {recipient.sub}
              </p>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          {/* Messages Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-2 rounded-xl transition-all ${
              searchOpen
                ? 'bg-violet-50 dark:bg-violet-950/20 text-violet-500'
                : 'text-gray-500 hover:text-violet-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-gray-800'
            }`}
            title="Search Messages"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Group details toggler */}
          {activeChat.isGroupChat && (
            <button
              onClick={() => {
                setGroupNameInput(activeChat.chatName || '');
                setGroupModalOpen(true);
              }}
              className="p-2 text-gray-500 hover:text-violet-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-gray-800 rounded-xl transition-all font-semibold text-xs flex items-center"
            >
              <Users className="w-4.5 h-4.5 mr-1" />
              Group Details
            </button>
          )}
        </div>
      </div>

      {/* Embedded Search input inside active view */}
      {searchOpen && (
        <div className="px-6 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <input
            type="text"
            value={messageSearchQuery}
            onChange={(e) => setMessageSearchQuery(e.target.value)}
            placeholder="Type word to search in this chat..."
            className="w-full bg-transparent text-xs text-gray-800 dark:text-gray-200 outline-none placeholder-gray-400 py-1.5"
            autoFocus
          />
          {messageSearchQuery && (
            <button onClick={() => setMessageSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold pl-2">
              Clear
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-grow overflow-y-auto px-6 py-4 space-y-3.5">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-xs text-gray-400 font-light">
              {messageSearchQuery ? 'No matching word found' : 'Chat room initialized. Write a hello note!'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isMe = msg.sender?._id === user._id || msg.sender === user._id;
            const hasSeen = msg.seenBy?.some(id => id !== user._id);

            return (
              <div
                key={msg._id}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Name for group chat */}
                {activeChat.isGroupChat && !isMe && (
                  <span className="text-[9px] text-gray-400 font-semibold mb-0.5 ml-12">
                    {msg.sender?.name || 'Group Member'}
                  </span>
                )}

                <div className="flex items-end space-x-2 max-w-[70%]">
                  {/* Recipient Profile Avatar for non-user message */}
                  {!isMe && (
                    <img
                      src={msg.sender?.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  )}

                  {/* Message Bubble Card */}
                  <div className="relative">
                    {editingMessageId === msg._id ? (
                      /* Editing Input field */
                      <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-2xl flex items-center space-x-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="px-3 py-1 text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 rounded-xl outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditMessage(msg._id)}
                          className="px-2 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      /* Message Content Bubble */
                      <div className={`p-3.5 rounded-2xl msg-bubble shadow-sm ${
                        isMe
                          ? 'bg-violet-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-800'
                      }`}>
                        
                        {/* If file image type */}
                        {msg.messageType === 'image' && (
                          <div className="mb-2 rounded-xl overflow-hidden max-w-sm aspect-video border border-white/20 shadow">
                            <img
                              src={msg.fileUrl}
                              alt="Uploaded attachment"
                              className="w-full h-full object-cover cursor-zoom-in"
                              onClick={() => window.open(msg.fileUrl, '_blank')}
                            />
                          </div>
                        )}

                        {/* If file download type */}
                        {msg.messageType === 'file' && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 p-2 bg-black/10 hover:bg-black/20 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-xs font-semibold underline mb-2"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]">{msg.content}</span>
                          </a>
                        )}

                        {/* Text Content */}
                        <p className="text-xs leading-relaxed font-light whitespace-pre-wrap">{msg.content}</p>
                        
                        {/* Timestamp & metrics */}
                        <div className="flex items-center justify-end space-x-1.5 mt-1.5 text-[9px] opacity-60">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {msg.edited && <span className="italic">(edited)</span>}
                          
                          {/* Seen checks for user messages */}
                          {isMe && !activeChat.isGroupChat && (
                            hasSeen ? (
                              <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions hover: edit & delete */}
                  {isMe && !msg.deleted && !editingMessageId && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity mb-2">
                      <button
                        onClick={() => {
                          setEditingMessageId(msg._id);
                          setEditText(msg.content);
                        }}
                        className="p-1.5 text-gray-400 hover:text-violet-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        title="Edit message"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer input controller */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-200/50 dark:border-gray-800/60 relative">
        
        {/* Upload overlay */}
        {uploadingFile && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center space-x-2 text-violet-500 font-semibold text-xs z-10">
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
            <span>Uploading Attachment...</span>
          </div>
        )}

        {/* Emojis panel */}
        {emojiOpen && (
          <div className="absolute bottom-16 left-6 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-20 grid grid-cols-8 gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setText((prev) => prev + emoji);
                  setEmojiOpen(false);
                }}
                className="text-lg hover:scale-125 active:scale-95 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center space-x-2.5">
          {/* File picker paperclip button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-500 hover:text-violet-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Attach image or file"
          >
            <Paperclip className="w-4.5 h-4.5" />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Emoji smile button */}
          <button
            type="button"
            onClick={() => setEmojiOpen(!emojiOpen)}
            className={`p-2.5 rounded-xl transition-all ${
              emojiOpen
                ? 'bg-violet-50 dark:bg-violet-950/20 text-violet-500'
                : 'text-gray-500 hover:text-violet-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-gray-800'
            }`}
            title="Add Emoji"
          >
            <Smile className="w-4.5 h-4.5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Type a message..."
            className="flex-grow px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 text-xs focus:ring-1 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl shadow-lg hover:shadow-xl shadow-violet-600/15 active:scale-95 transition-all outline-none"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

      {/* MODAL: Group settings details */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            onClick={() => setGroupModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          ></div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl relative z-10 max-w-sm w-full space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center">
                <Users className="w-4.5 h-4.5 mr-2 text-violet-500" />
                Group Details
              </h3>
              <button
                onClick={() => setGroupModalOpen(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Rename Group form */}
            {isGroupAdmin ? (
              <form onSubmit={handleGroupRename} className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Group Title (Admin only)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    className="flex-grow px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-xs text-gray-800 dark:text-gray-200 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={groupActionLoading}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[10px] rounded-xl"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                👤 Group Name: {activeChat.chatName}
              </div>
            )}

            {/* Add Member form (Admin only) */}
            {isGroupAdmin && (
              <form onSubmit={handleGroupAddMember} className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Add New Member by Email</label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    required
                    value={addMemberEmail}
                    onChange={(e) => setAddMemberEmail(e.target.value)}
                    placeholder="member@chatsphere.com"
                    className="flex-grow px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-xs text-gray-800 dark:text-gray-200 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={groupActionLoading}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[10px] rounded-xl flex items-center"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </button>
                </div>
              </form>
            )}

            {/* Group Members List */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                Members Directory ({activeChat.members?.length || 0})
              </span>
              <div className="h-40 border border-gray-200 dark:border-gray-800 rounded-xl overflow-y-auto p-2.5 space-y-2 bg-gray-50/50 dark:bg-gray-950/20">
                {activeChat.members?.map((m) => {
                  const isAdminOfGroup = activeChat.groupAdmin?._id === m._id || activeChat.groupAdmin === m._id;
                  const isSelf = m._id === user._id;

                  return (
                    <div key={m._id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <img
                          src={m.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                          alt={m.name}
                          className="w-6.5 h-6.5 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200 max-w-[150px] truncate">{m.name} {isSelf && '(You)'}</p>
                          <p className="text-[9px] text-gray-400 flex items-center">
                            {isAdminOfGroup && <Shield className="w-2.5 h-2.5 text-amber-500 mr-0.5" />}
                            {isAdminOfGroup ? 'Group Admin' : 'Member'}
                          </p>
                        </div>
                      </div>

                      {/* Remove button (Admin can remove anyone but self) */}
                      {isGroupAdmin && !isSelf && (
                        <button
                          onClick={() => handleRemoveMember(m._id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Remove from group"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave Group Action */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleLeaveGroup}
                className="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 dark:text-red-400 hover:text-red-600 font-bold text-xs rounded-xl flex items-center justify-center transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Leave Group Chat
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ChatArea;
