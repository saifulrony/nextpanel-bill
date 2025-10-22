'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        text: "Hello! I'm NextPanel AI Assistant. I can help you with domain registration, hosting services, billing questions, and more. How can I assist you today?",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Domain-related responses
    if (input.includes('domain') || input.includes('register')) {
      return "I can help you with domain registration! We offer domains starting from $8.99/year with free WHOIS privacy protection. You can search for available domains on our homepage or visit the domain management section. Would you like me to help you find a specific domain?";
    }
    
    // Hosting responses
    if (input.includes('hosting') || input.includes('server')) {
      return "Our hosting services include shared hosting, VPS, and dedicated servers. We offer 99.9% uptime guarantee with 24/7 support. You can view our hosting plans in the services section. What type of hosting are you looking for?";
    }
    
    // Billing responses
    if (input.includes('billing') || input.includes('payment') || input.includes('invoice')) {
      return "For billing questions, you can access your invoices and payment methods in the customer dashboard. We accept all major credit cards and PayPal. If you need help with a specific invoice, please provide the invoice number and I can assist you further.";
    }
    
    // Support responses
    if (input.includes('support') || input.includes('help') || input.includes('issue')) {
      return "I'm here to help! You can reach our support team through live chat or by creating a support ticket. For urgent issues, please use the live chat feature. What specific issue are you experiencing?";
    }
    
    // Pricing responses
    if (input.includes('price') || input.includes('cost') || input.includes('how much')) {
      return "Our pricing varies by service. Domain registrations start at $8.99/year, hosting plans start at $4.99/month, and VPS plans start at $19.99/month. You can view detailed pricing on our services page. Which service are you interested in?";
    }
    
    // General responses
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hello! Welcome to NextPanel. I'm here to help you with any questions about our services. What can I assist you with today?";
    }
    
    if (input.includes('thank') || input.includes('thanks')) {
      return "You're welcome! I'm happy to help. Is there anything else you'd like to know about our services?";
    }
    
    // Default response
    return "I understand you're asking about: \"" + userInput + "\". While I can help with general questions about our services, for specific technical issues or account-related matters, I'd recommend contacting our support team through live chat or creating a support ticket. How else can I assist you?";
  };

  const quickQuestions = [
    "How do I register a domain?",
    "What hosting plans do you offer?",
    "How can I contact support?",
    "What are your prices?",
    "How do I manage my account?",
  ];

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                message.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-1">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
