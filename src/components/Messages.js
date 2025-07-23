import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/messages/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/messages/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', newMessage);
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/messages/conversations/${selectedConversation._id}/messages`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setNewMessage('');
      setAttachments([]);
      fileInputRef.current.value = '';
      fetchMessages(selectedConversation._id);
      fetchConversations(); // Update unread counts
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };

  const formatAttachmentSize = (size) => {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-lg">
        {/* Conversations List */}
        <div className="w-1/3 border-r">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Conversations</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {conversations.map(conversation => (
              <div
                key={conversation._id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?._id === conversation._id
                    ? 'bg-blue-50'
                    : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      Order: {conversation.order.title}
                    </h3>
                    {conversation.lastMessage && (
                      <p className="text-gray-600 text-sm truncate">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conversation.unreadCount.get(conversation._id) > 0 && (
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                      {conversation.unreadCount.get(conversation._id)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(conversation.updatedAt), 'PPp')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">
                  {selectedConversation.order.title}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {messages.map(message => (
                  <div
                    key={message._id}
                    className={`mb-4 ${
                      message.sender._id === localStorage.getItem('userId')
                        ? 'ml-auto'
                        : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender._id === localStorage.getItem('userId')
                          ? 'bg-blue-500 text-white ml-auto'
                          : 'bg-gray-100'
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1">
                        {message.sender.name}
                        {message.isAdminMessage && ' (Admin)'}
                      </p>
                      <p>{message.content}</p>
                      {message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment, index) => (
                            <a
                              key={index}
                              href={`${process.env.REACT_APP_IMAGES_BASE_URL}/${attachment.path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm underline"
                            >
                              {attachment.filename}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(message.createdAt), 'PPp')}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="space-y-2">
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="bg-gray-100 rounded px-2 py-1 text-sm flex items-center"
                        >
                          <span>{file.name}</span>
                          <span className="text-gray-500 ml-2">
                            ({formatAttachmentSize(file.size)})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachments(prev =>
                                prev.filter((_, i) => i !== index)
                              );
                            }}
                            className="ml-2 text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 p-2 border rounded"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      📎
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages; 