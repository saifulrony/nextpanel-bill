'use client';

import { useState, useEffect } from 'react';
import { supportAPI } from '@/lib/api';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  TagIcon,
  CalendarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assigned_to?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
}

interface Reply {
  id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
  user_id: string;
}

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
  medium: { color: 'bg-blue-100 text-blue-800', icon: ExclamationCircleIcon },
  high: { color: 'bg-orange-100 text-orange-800', icon: ExclamationCircleIcon },
  urgent: { color: 'bg-red-100 text-red-800', icon: ExclamationCircleIcon },
};

const statusConfig = {
  open: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Open' },
  in_progress: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, label: 'In Progress' },
  waiting_for_customer: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'Waiting' },
  resolved: { color: 'bg-purple-100 text-purple-800', icon: CheckCircleIcon, label: 'Resolved' },
  closed: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon, label: 'Closed' },
};

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await supportAPI.listTickets();
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }
    
    setFilteredTickets(filtered);
  };

  const loadTicketDetails = async (ticketId: string) => {
    try {
      const [ticketResponse, repliesResponse] = await Promise.all([
        supportAPI.getTicket(ticketId),
        supportAPI.getReplies(ticketId)
      ]);
      setSelectedTicket(ticketResponse.data);
      setReplies(repliesResponse.data);
    } catch (error) {
      console.error('Failed to load ticket details:', error);
    }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await supportAPI.createTicket(newTicket);
      setNewTicket({ subject: '', description: '', priority: 'medium', category: 'general' });
      setShowNewTicket(false);
      await loadTickets();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create ticket');
    }
  };

  const addReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTicket || !newReply.trim()) return;
    
    try {
      await supportAPI.addReply(selectedTicket.id, newReply);
      setNewReply('');
      await loadTicketDetails(selectedTicket.id);
    } catch (error) {
      alert('Failed to add reply');
    }
  };

  const closeTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to close this ticket?')) return;
    
    try {
      await supportAPI.closeTicket(ticketId);
      await loadTickets();
      setSelectedTicket(null);
    } catch (error) {
      alert('Failed to close ticket');
    }
  };

  const getStatusCounts = () => {
    return {
      all: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      waiting_for_customer: tickets.filter(t => t.status === 'waiting_for_customer').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            <p className="mt-2 text-sm text-gray-600">
              Get help from our support team with your questions and issues
            </p>
          </div>
          <button
            onClick={() => setShowNewTicket(!showNewTicket)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{counts.all}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Open</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">{counts.open}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600">{counts.in_progress}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Waiting</dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-600">{counts.waiting_for_customer}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
            <dd className="mt-1 text-3xl font-semibold text-purple-600">{counts.resolved}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Closed</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-600">{counts.closed}</dd>
          </div>
        </div>
      </div>

      {/* New Ticket Form */}
      {showNewTicket && (
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Create Support Ticket
            </h3>
            <form onSubmit={createTicket} className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject *
                </label>
                <input
                  id="subject"
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Brief summary of your issue"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  required
                  rows={4}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Describe your issue in detail..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="general">General Question</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="technical">Technical Support</option>
                    <option value="account">Account Management</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  Create Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {!selectedTicket && (
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search tickets by subject, number, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 mb-4"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_for_customer">Waiting</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="account">Account</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tickets List / Ticket Details */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {selectedTicket ? (
            // Ticket Details View
            <div>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to tickets
                </button>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedTicket.status].color}`}>
                    {statusConfig[selectedTicket.status].label}
                  </span>
                  {selectedTicket.status !== 'closed' && (
                    <button
                      onClick={() => closeTicket(selectedTicket.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Close Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Ticket Header */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedTicket.subject}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 mr-1" />
                    #{selectedTicket.ticket_number}
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[selectedTicket.priority].color}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>
                  {selectedTicket.category && (
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {selectedTicket.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Replies */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Conversation</h4>
                <div className="space-y-4">
                  {replies.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No replies yet. Be the first to respond!</p>
                  ) : (
                    replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-lg ${reply.is_staff ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <UserCircleIcon className={`h-5 w-5 mr-2 ${reply.is_staff ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <span className="font-medium text-gray-900">
                              {reply.is_staff ? 'Support Team' : 'You'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== 'closed' && (
                <form onSubmit={addReply} className="border-t pt-6">
                  <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-2">
                    Add Reply
                  </label>
                  <textarea
                    id="reply"
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-3"
                  />
                  <button
                    type="submit"
                    disabled={!newReply.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Send Reply
                  </button>
                </form>
              )}
            </div>
          ) : (
            // Tickets List View
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Support Tickets
              </h3>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading tickets...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {tickets.length === 0 ? 'No support tickets yet' : 'No tickets match your filters'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {tickets.length === 0 
                      ? 'Create a new ticket if you need assistance.'
                      : 'Try adjusting your search or filters.'
                    }
                  </p>
                  {tickets.length === 0 && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowNewTicket(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Your First Ticket
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTickets.map((ticket) => {
                    const StatusIcon = statusConfig[ticket.status].icon;
                    const PriorityIcon = priorityConfig[ticket.priority].icon;
                    
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => loadTicketDetails(ticket.id)}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">{ticket.subject}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                            <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500">
                              <span className="flex items-center">
                                <TagIcon className="h-4 w-4 mr-1" />
                                #{ticket.ticket_number}
                              </span>
                              <span>•</span>
                              <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                              {ticket.category && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{ticket.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end ml-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[ticket.status].color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[ticket.status].label}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[ticket.priority].color}`}>
                              <PriorityIcon className="h-3 w-3 mr-1" />
                              {ticket.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
