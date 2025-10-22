'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
}

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInfo, setChatInfo] = useState({
    id: params.id,
    subject: 'Domain registration issue',
    status: 'active',
    startedAt: new Date('2024-01-15T10:30:00'),
  });

  // Load chat messages (mock data)
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        text: 'Hello, I need help with my domain registration. It seems to be stuck in pending status.',
        sender: 'user',
        timestamp: new Date('2024-01-15T10:30:00'),
      },
      {
        id: '2',
        text: "Hello! I'm here to help you with your domain registration issue. Let me check the status of your domain for you.",
        sender: 'support',
        timestamp: new Date('2024-01-15T10:31:00'),
      },
      {
        id: '3',
        text: 'I can see that your domain registration is currently being processed. This usually takes 24-48 hours to complete. Is there anything specific you\'d like me to check?',
        sender: 'support',
        timestamp: new Date('2024-01-15T10:32:00'),
      },
      {
        id: '4',
        text: 'Thank you for the update. When will I be able to use my domain?',
        sender: 'user',
        timestamp: new Date('2024-01-15T10:35:00'),
      },
    ];
    
    setMessages(mockMessages);
  }, [params.id]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    // Simulate support response
    setTimeout(() => {
      const supportMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I understand your concern. Once the domain registration is complete, you'll be able to use it immediately. I'll keep you updated on the progress.",
        sender: 'support',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, supportMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'resolved':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{chatInfo.subject}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      chatInfo.status
                    )}`}
                  >
                    {chatInfo.status}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Started {chatInfo.startedAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white shadow rounded-lg">
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
      </div>
    </div>
  );
}
