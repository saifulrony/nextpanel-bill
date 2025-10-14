'use client';

import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '@/lib/api';
import {
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  StarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ChatSession {
  id: string;
  user_id?: string;
  guest_email?: string;
  guest_name?: string;
  guest_phone?: string;
  session_token?: string;
  status: 'active' | 'closed' | 'archived';
  assigned_to?: string;
  subject?: string;
  rating?: number;
  created_at: string;
  updated_at?: string;
  closed_at?: string;
  unread_count?: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'user' | 'admin' | 'bot' | 'system';
  sender_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

const statusConfig = {
  active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Active' },
  closed: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon, label: 'Closed' },
  archived: { color: 'bg-gray-100 text-gray-600', icon: XCircleIcon, label: 'Archived' },
};

export default function LiveChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showFilters, setShowFilters] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadSessions();
    loadStats();
    
    // Auto-refresh every 10 seconds for active chats
    refreshIntervalRef.current = setInterval(() => {
      if (selectedSession && selectedSession.status === 'active') {
        loadMessages(selectedSession.id);
      }
      loadSessions();
    }, 10000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, searchTerm, statusFilter]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const response = await chatAPI.listSessions();
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await chatAPI.stats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load chat stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }
    
    // Sort by unread and recent
    filtered.sort((a, b) => {
      if ((a.unread_count || 0) > 0 && (b.unread_count || 0) === 0) return -1;
      if ((a.unread_count || 0) === 0 && (b.unread_count || 0) > 0) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    setFilteredSessions(filtered);
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await chatAPI.getMessages(sessionId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const selectSession = async (session: ChatSession) => {
    setSelectedSession(session);
    await loadMessages(session.id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSession || !newMessage.trim()) return;
    
    try {
      await chatAPI.sendMessage(selectedSession.id, { message: newMessage });
      setNewMessage('');
      await loadMessages(selectedSession.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const closeSession = async (sessionId: string) => {
    if (!confirm('Close this chat session?')) return;
    
    try {
      await chatAPI.closeSession(sessionId);
      await loadSessions();
      setSelectedSession(null);
    } catch (error) {
      alert('Failed to close session');
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Chat Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage customer chat sessions and respond in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Sessions</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total_sessions}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Chats</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.active_sessions}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Avg Rating</dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : 'N/A'}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Messages</dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">{stats.total_messages}</dd>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Chat Sessions List */}
          <div className="col-span-1 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              {/* Status Filter Tabs */}
              <div className="flex gap-2">
                {[
                  { key: 'active', label: 'Active' },
                  { key: 'closed', label: 'Closed' },
                  { key: 'all', label: 'All' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md ${
                      statusFilter === tab.key
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No chat sessions found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => selectSession(session)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedSession?.id === session.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <UserCircleIcon className="h-8 w-8 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {session.guest_name || session.guest_email || 'Anonymous'}
                            </p>
                            {session.subject && (
                              <p className="text-xs text-gray-500">{session.subject}</p>
                            )}
                          </div>
                        </div>
                        {(session.unread_count || 0) > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                            {session.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[session.status].color}`}>
                          {statusConfig[session.status].label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(session.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      {session.rating && (
                        <div className="flex items-center mt-2">
                          {[...Array(5)].map((_, i) => (
                            <StarIconSolid
                              key={i}
                              className={`h-4 w-4 ${i < session.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="col-span-2 flex flex-col">
            {selectedSession ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-10 w-10 text-gray-400 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {selectedSession.guest_name || selectedSession.guest_email || 'Anonymous User'}
                        </h3>
                        <div className="space-y-1">
                          {selectedSession.guest_email && (
                            <p className="text-sm text-gray-500">📧 {selectedSession.guest_email}</p>
                          )}
                          {selectedSession.guest_phone && (
                            <p className="text-sm text-gray-500">📱 {selectedSession.guest_phone}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            Session started: {new Date(selectedSession.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedSession.status].color}`}>
                        {statusConfig[selectedSession.status].label}
                      </span>
                      {selectedSession.status === 'active' && (
                        <button
                          onClick={() => closeSession(selectedSession.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Close Chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((message) => {
                    const isBot = message.sender_type === 'bot';
                    const isAdmin = message.sender_type === 'admin';
                    const isSystem = message.sender_type === 'system';
                    const isUser = message.sender_type === 'user';

                    if (isSystem) {
                      return (
                        <div key={message.id} className="flex justify-center">
                          <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                            {message.message}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isBot || isAdmin ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-sm lg:max-w-md xl:max-w-lg ${isBot || isAdmin ? 'order-1' : 'order-2'}`}>
                          <div className={`rounded-lg p-3 ${
                            isBot ? 'bg-purple-100 border border-purple-200' :
                            isAdmin ? 'bg-indigo-100 border border-indigo-200' :
                            'bg-white border border-gray-200 shadow-sm'
                          }`}>
                            <div className="flex items-center mb-1">
                              {(isBot || isAdmin) && (
                                <UserCircleIcon className={`h-4 w-4 mr-1 ${isBot ? 'text-purple-600' : 'text-indigo-600'}`} />
                              )}
                              <span className="text-xs font-medium text-gray-600">
                                {message.sender_name || (isBot ? 'AI Bot' : isAdmin ? 'Support' : 'Customer')}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {selectedSession.status === 'active' && (
                  <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="appearance-none flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Select a chat to view</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose a chat session from the list to view messages and respond
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

