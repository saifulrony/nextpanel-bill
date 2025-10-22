'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'customer' | 'admin';
  senderName: string;
  timestamp: Date;
  isRead: boolean;
}

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function AdminChatPage({ params }: ChatPageProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInfo, setChatInfo] = useState({
    id: params.id,
    customerId: 'customer-1',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    subject: 'Domain registration issue',
    status: 'active',
    priority: 'high',
    assignedTo: 'Sarah Johnson',
    startedAt: new Date('2024-01-15T10:30:00'),
    lastActivity: new Date('2024-01-15T14:30:00'),
  });

  // Load chat messages (mock data)
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        text: 'Hello, I need help with my domain registration. It seems to be stuck in pending status.',
        sender: 'customer',
        senderName: 'John Doe',
        timestamp: new Date('2024-01-15T10:30:00'),
        isRead: true,
      },
      {
        id: '2',
        text: "Hello John! I'm Sarah from the support team. I can see that your domain registration is currently being processed. Let me check the status for you.",
        sender: 'admin',
        senderName: 'Sarah Johnson',
        timestamp: new Date('2024-01-15T10:32:00'),
        isRead: true,
      },
      {
        id: '3',
        text: 'I can see that your domain registration is currently being processed. This usually takes 24-48 hours to complete. Is there anything specific you\'d like me to check?',
        sender: 'admin',
        senderName: 'Sarah Johnson',
        timestamp: new Date('2024-01-15T10:35:00'),
        isRead: true,
      },
      {
        id: '4',
        text: 'Thank you for the update. When will I be able to use my domain?',
        sender: 'customer',
        senderName: 'John Doe',
        timestamp: new Date('2024-01-15T10:40:00'),
        isRead: true,
      },
      {
        id: '5',
        text: "Once the domain registration is complete, you'll be able to use it immediately. I'll keep you updated on the progress and send you an email once it's ready.",
        sender: 'admin',
        senderName: 'Sarah Johnson',
        timestamp: new Date('2024-01-15T10:42:00'),
        isRead: true,
      },
      {
        id: '6',
        text: 'Thank you for your help!',
        sender: 'customer',
        senderName: 'John Doe',
        timestamp: new Date('2024-01-15T14:30:00'),
        isRead: false,
      },
    ];
    
    setMessages(mockMessages);
  }, [params.id]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const adminMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'admin',
      senderName: 'You',
      timestamp: new Date(),
      isRead: true,
    };
    
    setMessages(prev => [...prev, adminMessage]);
    setMessage('');
    setIsLoading(true);

    // Simulate customer response
    setTimeout(() => {
      const customerMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I understand. Thank you for the clarification. I'll wait for the email notification.",
        sender: 'customer',
        senderName: chatInfo.customerName,
        timestamp: new Date(),
        isRead: false,
      };
      
      setMessages(prev => [...prev, customerMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleStatusChange = (newStatus: string) => {
    setChatInfo(prev => ({ ...prev, status: newStatus }));
  };

  const handleAssignTo = (adminName: string) => {
    setChatInfo(prev => ({ ...prev, assignedTo: adminName }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = messages.filter(msg => msg.sender === 'customer' && !msg.isRead).length;

  return (
    <div className="max-w-7xl mx-auto">
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
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                      chatInfo.priority
                    )}`}
                  >
                    {chatInfo.priority}
                  </span>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleStatusChange('resolved')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Resolve
              </button>
              <button
                onClick={() => handleStatusChange('closed')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Close Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg">
            <div className="flex flex-col h-96">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'admin'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium opacity-75">
                          {msg.senderName}
                        </span>
                        {msg.sender === 'customer' && !msg.isRead && (
                          <span className="text-xs bg-red-500 text-white px-1 rounded">NEW</span>
                        )}
                      </div>
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'admin' ? 'text-indigo-100' : 'text-gray-500'
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
                        <span className="text-sm text-gray-500">Customer is typing...</span>
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{chatInfo.customerName}</p>
                    <p className="text-sm text-gray-500">Customer</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-900">{chatInfo.customerEmail}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Started {chatInfo.startedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chat Actions</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={chatInfo.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="waiting">Waiting</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  <select
                    value={chatInfo.assignedTo}
                    onChange={(e) => handleAssignTo(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="Sarah Johnson">Sarah Johnson</option>
                    <option value="Mike Wilson">Mike Wilson</option>
                    <option value="You">You</option>
                  </select>
                </div>
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Call Customer
                </button>
              </div>
            </div>
          </div>

          {/* Quick Responses */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Responses</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setMessage("Thank you for contacting us. I'm looking into this issue for you.")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Acknowledgment
                </button>
                <button
                  onClick={() => setMessage("I need to check this with our technical team. I'll get back to you shortly.")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Technical Check
                </button>
                <button
                  onClick={() => setMessage("This issue has been resolved. Please let me know if you need anything else.")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Resolution
                </button>
                <button
                  onClick={() => setMessage("Is there anything else I can help you with today?")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Follow-up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
