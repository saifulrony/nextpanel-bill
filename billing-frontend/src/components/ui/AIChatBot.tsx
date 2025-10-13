'use client';

import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '@/lib/api';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showContactForm, setShowContactForm] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Contact form state
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [contactErrors, setContactErrors] = useState({
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (isOpen && messages.length === 0 && !showContactForm) {
      // Send welcome message (only after contact form is submitted)
      addBotMessage("Hello! 👋 I'm your AI assistant. I can help you with:\n• Pricing and Plans\n• Product Features\n• Billing Questions\n• Getting Started\n\nWhat would you like to know?");
      setSuggestions(['View pricing plans', 'Tell me about features', 'How do I get started?']);
    }
  }, [isOpen, showContactForm]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (message: string, newSuggestions?: string[]) => {
    const botMessage: Message = {
      id: Date.now().toString() + '-bot',
      sender: 'bot',
      message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMessage]);
    if (newSuggestions) {
      setSuggestions(newSuggestions);
    }
  };

  const addUserMessage = (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const validateContactForm = () => {
    const errors = { email: '', phone: '' };
    let isValid = true;
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactInfo.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(contactInfo.email)) {
      errors.email = 'Please enter a valid email';
      isValid = false;
    }
    
    // Phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!contactInfo.phone) {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else if (!phoneRegex.test(contactInfo.phone)) {
      errors.phone = 'Please enter a valid phone number';
      isValid = false;
    }
    
    setContactErrors(errors);
    return isValid;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateContactForm()) {
      setShowContactForm(false);
    }
  };

  const sendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend) return;

    // Add user message
    addUserMessage(messageToSend);
    setInputMessage('');
    setSuggestions([]);
    setIsTyping(true);

    try {
      // Get API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');

      // Send to AI bot endpoint
      const response = await axios.post(`${apiUrl}/api/v1/chat/bot`, {
        message: messageToSend,
        session_id: sessionId,
        guest_email: contactInfo.email,
        guest_name: contactInfo.name || 'Guest',
        guest_phone: contactInfo.phone,
        context: {
          page: window.location.pathname,
          referrer: document.referrer,
        }
      });

      const data = response.data;
      
      // Store session ID for context
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      // Simulate typing delay
      setTimeout(() => {
        addBotMessage(data.message, data.suggestions);
        setIsTyping(false);
      }, 500);

    } catch (error) {
      console.error('Failed to get bot response:', error);
      addBotMessage("I'm sorry, I'm having trouble connecting right now. Please try again or contact our support team directly.");
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:scale-110"
        aria-label="Open chat"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all ${
      isMinimized ? 'w-80' : 'w-96'
    }`}>
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <SparklesIcon className="h-6 w-6 mr-2" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></span>
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs opacity-90">Online now</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
              aria-label="Minimize"
            >
              <MinusIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
              aria-label="Close chat"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Contact Form (shown first for guests) */}
          {showContactForm ? (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a Conversation</h3>
                <p className="text-sm text-gray-600">
                  Please provide your contact information to begin chatting with our AI assistant
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="guest_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="guest_name"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="guest_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="guest_email"
                    value={contactInfo.email}
                    onChange={(e) => {
                      setContactInfo({ ...contactInfo, email: e.target.value });
                      setContactErrors({ ...contactErrors, email: '' });
                    }}
                    required
                    className={`appearance-none block w-full px-3 py-2 border ${
                      contactErrors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="you@example.com"
                  />
                  {contactErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{contactErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="guest_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="guest_phone"
                    value={contactInfo.phone}
                    onChange={(e) => {
                      setContactInfo({ ...contactInfo, phone: e.target.value });
                      setContactErrors({ ...contactErrors, phone: '' });
                    }}
                    required
                    className={`appearance-none block w-full px-3 py-2 border ${
                      contactErrors.phone ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {contactErrors.phone && (
                    <p className="mt-1 text-xs text-red-600">{contactErrors.phone}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Start Chat
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Your information is secure and will only be used to contact you about your inquiry
              </p>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className="flex items-center mb-1">
                      <SparklesIcon className="h-4 w-4 text-purple-600 mr-1" />
                      <span className="text-xs font-medium text-purple-600">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

              {/* Quick Suggestions */}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="inline-flex items-center px-3 py-1 border border-indigo-300 text-xs font-medium rounded-full text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    className="appearance-none flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isTyping}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Powered by AI • {messages.length} messages
                </p>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
}

