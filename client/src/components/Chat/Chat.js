import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiPlus, FiMessageSquare } from 'react-icons/fi';
import { chatAPI, pdfAPI } from '../../services/api';
import PDFViewer from '../PDF/PDFViewer';
import toast from 'react-hot-toast';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [pdfs, setPdfs] = useState([]);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedPdfId, setSelectedPdfId] = useState(null);

  useEffect(() => {
    fetchChats();
    fetchPDFs();
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
      toast.success('New chat created');
    } catch (error) {
      toast.error('Failed to create chat');
    }
  };

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
        content: newMessage.trim()
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow">
        {/* Chat List Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
              <button
                onClick={createNewChat}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200"
              >
                <FiPlus className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-4 text-center">
                <FiMessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No chats yet</p>
                <button
                  onClick={createNewChat}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium mt-2"
                >
                  Start your first chat
                </button>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {chats.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => setCurrentChat(chat)}
                    className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                      currentChat?._id === chat._id
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <h3 className="font-medium truncate">{chat.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {chat.messages?.length || 0} messages
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window + Optional PDF Viewer */}
        <div className={`flex-1 flex ${showViewer ? 'flex-row' : 'flex-col'}`}>
          {currentChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentChat.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={selectedPdfId || ''}
                    onChange={(e) => setSelectedPdfId(e.target.value || null)}
                  >
                    <option value="">No PDF</option>
                    {pdfs.map(pdf => (
                      <option key={pdf._id || pdf.id} value={pdf._id || pdf.id}>
                        {pdf.originalName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowViewer(v => !v)}
                    className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    {showViewer ? 'Hide PDF' : 'Show PDF'}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className={`${showViewer ? 'w-1/2' : 'w-full'} flex-1 overflow-y-auto p-4 space-y-4`}>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <FiMessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Start a conversation</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Ask questions about your study materials
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Citations for assistant messages */}
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Sources:</p>
                            {message.citations.map((citation, idx) => (
                              <p key={idx} className="text-xs text-gray-400">
                                Page {citation.pageNumber}: "{citation.snippet.substring(0, 50)}..."
                              </p>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="spinner"></div>
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* PDF Viewer side panel */}
              {showViewer && (
                <div className="w-1/2 border-l border-gray-200">
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

              {/* Message Input */}
              <div className="w-full p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSend className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FiMessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a chat to start
                </h3>
                <p className="text-gray-500">
                  Choose an existing chat or create a new one to begin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
