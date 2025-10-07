import React, { useState, useEffect, useRef } from 'react';
import { 
  FiSend, 
  FiPlus, 
  FiMessageSquare, 
  FiSearch, 
  FiEdit3,
  FiTrash2,
  FiPaperclip,
  FiUser,
  FiClock,
  FiEye,
  FiEyeOff,
  FiChevronLeft,
  FiMenu
} from 'react-icons/fi';
import { chatAPI, pdfAPI } from '../../services/api';
import PDFViewer from '../PDF/PDFViewer';
import toast from 'react-hot-toast';
import './Chat.css';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [pdfs, setPdfs] = useState([]);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedPdfId, setSelectedPdfId] = useState(null);
  
  // Enhanced UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editChatTitle, setEditChatTitle] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchChats(), fetchPDFs()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (currentChat) {
      setMessages(currentChat.messages || []);
    } else {
      setMessages([]);
    }
    scrollToBottom();
  }, [currentChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const response = await chatAPI.getAll();
      setChats(response.data.chats);
    } catch (error) {
      toast.error('Failed to load chats');
      console.error('Chat fetch error:', error);
    }
  };

  const fetchPDFs = async () => {
    try {
      const res = await pdfAPI.getAll();
      setPdfs(res.data.pdfs);
    } catch (e) {}
  };

  const createNewChat = async () => {
    try {
      const response = await chatAPI.create({
        title: 'New Chat',
        pdfContext: []
      });
      setChats([response.data.chat, ...chats]);
      setCurrentChat(response.data.chat);
      setEditingChatId(response.data.chat._id);
      setEditChatTitle('New Chat');
      toast.success('New chat created');
    } catch (error) {
      toast.error('Failed to create chat');
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await chatAPI.delete(chatId);
      setChats(chats.filter(chat => chat._id !== chatId));
      if (currentChat?._id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const updateChatTitle = async (chatId, newTitle) => {
    try {
      await chatAPI.update(chatId, { title: newTitle });
      setChats(chats.map(chat => 
        chat._id === chatId ? { ...chat, title: newTitle } : chat
      ));
      if (currentChat?._id === chatId) {
        setCurrentChat({ ...currentChat, title: newTitle });
      }
      setEditingChatId(null);
      toast.success('Chat title updated');
    } catch (error) {
      toast.error('Failed to update chat title');
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return;

    const userMessage = {
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setNewMessage('');
    setSending(true);

    try {
      const response = await chatAPI.sendMessage(currentChat._id, {
        content: newMessage.trim(),
        pdfContext: selectedPdfId ? [selectedPdfId] : []
      });

      const assistantMessage = response.data.message;
      setMessages([...messages, userMessage, assistantMessage]);
      
      // Update current chat with new messages
      const updatedChat = {
        ...currentChat,
        messages: [...messages, userMessage, assistantMessage]
      };
      setCurrentChat(updatedChat);
      
      // Update chats list
      setChats(chats.map(chat => 
        chat._id === currentChat._id ? updatedChat : chat
      ));
    } catch (error) {
      toast.error('Failed to send message');
      // Remove the user message if sending failed
      setMessages(messages);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your chat experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}></div>
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl">
            {/* Mobile sidebar content will be here */}
          </div>
        </div>
      )}

      {/* Enhanced Chat List Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} ${showMobileMenu ? 'block' : 'hidden'} lg:block transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col shadow-lg`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <FiMessageSquare className="h-6 w-6" />
                <h2 className="text-lg font-semibold">Study Assistant</h2>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <button
                onClick={createNewChat}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200 group"
                title="New Chat"
              >
                <FiPlus className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200"
                title="Toggle Sidebar"
              >
                <FiChevronLeft className={`h-5 w-5 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        )}
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 chat-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="p-6 text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FiMessageSquare className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-gray-600 font-medium mb-2">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                {searchQuery ? 'Try a different search term' : 'Start a conversation with your study assistant'}
              </p>
              {!searchQuery && (
                <button
                  onClick={createNewChat}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start your first chat
                </button>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  className={`group relative rounded-lg transition-all duration-200 ${
                    currentChat?._id === chat._id
                      ? 'bg-purple-50 border border-purple-200 shadow-sm'
                      : 'hover:bg-white hover:shadow-sm border border-transparent'
                  }`}
                >
                  <button
                    onClick={() => {
                      setCurrentChat(chat);
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left p-3 rounded-lg transition-colors duration-200 chat-item"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {editingChatId === chat._id ? (
                          <input
                            type="text"
                            value={editChatTitle}
                            onChange={(e) => setEditChatTitle(e.target.value)}
                            onBlur={() => updateChatTitle(chat._id, editChatTitle)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateChatTitle(chat._id, editChatTitle);
                              }
                            }}
                            className="w-full bg-transparent border-none outline-none font-medium text-gray-900"
                            autoFocus
                          />
                        ) : (
                          <h3 className="font-medium text-gray-900 truncate">{chat.title}</h3>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {chat.messages?.length || 0} messages
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500">
                            {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Chat Actions Menu */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChatId(chat._id);
                              setEditChatTitle(chat.title);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors duration-200"
                            title="Rename chat"
                          >
                            <FiEdit3 className="h-3 w-3 text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this chat?')) {
                                deleteChat(chat._id);
                              }
                            }}
                            className="p-1 hover:bg-red-100 rounded transition-colors duration-200"
                            title="Delete chat"
                          >
                            <FiTrash2 className="h-3 w-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white shadow-lg">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <button
            onClick={() => setShowMobileMenu(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <FiMenu className="h-5 w-5 text-gray-600" />
          </button>
          <h3 className="font-semibold text-gray-900 truncate">
            {currentChat?.title || 'Study Assistant'}
          </h3>
          <div className="w-9"></div>
        </div>

        {currentChat ? (
          <>
            {/* Enhanced Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <FiMessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentChat.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {messages.length} messages • Last active {new Date(currentChat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={selectedPdfId || ''}
                    onChange={(e) => setSelectedPdfId(e.target.value || null)}
                  >
                    <option value="">No PDF Context</option>
                    {pdfs.map(pdf => (
                      <option key={pdf._id || pdf.id} value={pdf._id || pdf.id}>
                        {pdf.originalName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowViewer(!showViewer)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      showViewer 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showViewer ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    <span className="hidden sm:inline">{showViewer ? 'Hide' : 'Show'} PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className={`${showViewer ? 'w-1/2' : 'w-full'} flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white chat-scrollbar`}>
              <div className="p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <FiMessageSquare className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Welcome to your Study Assistant
                    </h3>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                      Ask questions about your study materials, get explanations, or request practice problems.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        "Explain this concept"
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        "Give me examples"
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        "Create a quiz"
                      </span>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`flex items-start space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {message.role === 'user' ? <FiUser className="h-4 w-4" /> : <FiMessageSquare className="h-4 w-4" />}
                        </div>
                        
                        {/* Message Content */}
                        <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div
                            className={`inline-block px-4 py-3 rounded-2xl shadow-sm message-bubble ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Enhanced Citations for assistant messages */}
                            {message.citations && message.citations.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                                  <span className="mr-1">📚</span>
                                  Sources ({message.citations.length})
                                  {message.citations[0]?.semanticScore && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                      AI-Powered Search
                                    </span>
                                  )}
                                </p>
                                <div className="space-y-2">
                                  {message.citations.map((citation, idx) => (
                                    <div key={idx} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="font-medium text-gray-700">
                                          Page {citation.pageNumber}
                                        </span>
                                        {citation.relevanceScore && (
                                          <span className="text-xs text-gray-500">
                                            {Math.round(citation.relevanceScore * 100)}% match
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-gray-600 leading-relaxed">
                                        "{citation.snippet.substring(0, 120)}..."
                                      </p>
                                      {citation.semanticScore && (
                                        <div className="mt-1 flex items-center text-xs text-blue-600">
                                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                          Semantic match: {Math.round(citation.semanticScore * 100)}%
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Timestamp */}
                          <div className={`mt-1 text-xs text-gray-500 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <FiClock className="inline h-3 w-3 mr-1" />
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {sending && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <FiMessageSquare className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                          </div>
                          <span className="text-sm text-gray-600">Assistant is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Enhanced Message Input */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about your study materials..."
                    className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 input-focus"
                    rows={1}
                    disabled={sending}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Attach file"
                  >
                    <FiPaperclip className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white p-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  <FiSend className="h-5 w-5" />
                </button>
              </div>
              
              {/* Input Footer */}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Press Enter to send, Shift+Enter for new line</span>
                {selectedPdfId && (
                  <span className="flex items-center space-x-1">
                    <FiPaperclip className="h-3 w-3" />
                    <span>PDF context enabled</span>
                  </span>
                )}
              </div>
            </div>

            {/* PDF Viewer side panel */}
            {showViewer && (
              <div className="w-1/2 border-l border-gray-200 bg-white">
                {(() => {
                  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                  const serverOrigin = apiBase.replace(/\/?api\/?$/, '');
                  const selected = pdfs.find(p => (p._id || p.id) === selectedPdfId);
                  const fileUrl = selected ? `${serverOrigin}/uploads/pdfs/${selected.filename}` : null;
                  return (
                    <PDFViewer fileUrl={fileUrl} />
                  );
                })()}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
            <div className="text-center max-w-md">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <FiMessageSquare className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Welcome to Study Assistant
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your intelligent learning companion. Start a conversation by selecting an existing chat or creating a new one.
              </p>
              <button
                onClick={createNewChat}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    
  );
};

export default Chat;
