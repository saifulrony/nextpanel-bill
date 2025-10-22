'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function NewChatPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'support';
    timestamp: Date;
  }>>([]);

  const handleStartChat = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    
    setMessages([userMessage]);
    setChatStarted(true);
    setMessage('');

    // Simulate support response
    setTimeout(() => {
      const supportMessage = {
        id: (Date.now() + 1).toString(),
        text: "Hello! Thank you for reaching out. I'm here to help you with any questions or issues you may have. How can I assist you today?",
        sender: 'support' as const,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, supportMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    // Simulate support response
    setTimeout(() => {
      const supportMessage = {
        id: (Date.now() + 1).toString(),
        text: "I understand your concern. Let me help you with that. Could you provide more details about the issue you're experiencing?",
        sender: 'support' as const,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, supportMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleEndChat = () => {
    router.push('/customer/support');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Chat Support</h1>
                <p className="text-sm text-gray-500">
                  Get instant help from our support team
                </p>
              </div>
            </div>
            <button
              onClick={handleEndChat}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              End Chat
            </button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white shadow rounded-lg">
        {!chatStarted ? (
          /* Start Chat Form */
          <div className="p-6">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Start a new chat
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Describe your issue or question to get started
              </p>
            </div>
            
            <div className="mt-6">
              <label htmlFor="initial-message" className="block text-sm font-medium text-gray-700">
                What can we help you with?
              </label>
              <div className="mt-1">
                <textarea
                  id="initial-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Describe your issue or question..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleStartChat}
                disabled={!message.trim() || isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Starting...' : 'Start Chat'}
              </button>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex flex-col h-96">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender === 'user' ? 'text-indigo-100' : 'text-gray-500'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Support is typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
