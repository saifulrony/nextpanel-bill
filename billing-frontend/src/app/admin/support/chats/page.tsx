'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface Chat {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  status: 'active' | 'waiting' | 'resolved' | 'closed';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdAt: Date;
}

export default function AdminChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastMessage');

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockChats: Chat[] = [
      {
        id: '1',
        customerId: 'customer-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        subject: 'Domain registration issue',
        status: 'active',
        lastMessage: 'Thank you for your help!',
        lastMessageTime: new Date('2024-01-15T14:30:00'),
        unreadCount: 0,
        priority: 'high',
        assignedTo: 'Sarah Johnson',
        createdAt: new Date('2024-01-15T10:30:00'),
      },
      {
        id: '2',
        customerId: 'customer-2',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        subject: 'Billing question',
        status: 'waiting',
        lastMessage: 'I need help with my invoice',
        lastMessageTime: new Date('2024-01-15T13:45:00'),
        unreadCount: 2,
        priority: 'medium',
        assignedTo: 'Mike Wilson',
        createdAt: new Date('2024-01-15T11:20:00'),
      },
      {
        id: '3',
        customerId: 'customer-3',
        customerName: 'Bob Johnson',
        customerEmail: 'bob@example.com',
        subject: 'Hosting migration',
        status: 'resolved',
        lastMessage: 'Migration completed successfully',
        lastMessageTime: new Date('2024-01-14T16:20:00'),
        unreadCount: 0,
        priority: 'low',
        assignedTo: 'Sarah Johnson',
        createdAt: new Date('2024-01-14T09:15:00'),
      },
      {
        id: '4',
        customerId: 'customer-4',
        customerName: 'Alice Brown',
        customerEmail: 'alice@example.com',
        subject: 'SSL certificate problem',
        status: 'active',
        lastMessage: 'The SSL is not working properly',
        lastMessageTime: new Date('2024-01-15T15:10:00'),
        unreadCount: 1,
        priority: 'urgent',
        assignedTo: 'Mike Wilson',
        createdAt: new Date('2024-01-15T12:00:00'),
      },
    ];

    setChats(mockChats);
    setFilteredChats(mockChats);
    setLoading(false);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = chats;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(chat =>
        chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(chat => chat.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(chat => chat.priority === priorityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'lastMessage':
          return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

    setFilteredChats(filtered);
  }, [chats, searchQuery, statusFilter, priorityFilter, sortBy]);

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

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
  const activeChats = chats.filter(chat => chat.status === 'active').length;
  const waitingChats = chats.filter(chat => chat.status === 'waiting').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Support Chats</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage customer support conversations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{totalUnread}</div>
                <div className="text-sm text-gray-500">Unread messages</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Chats</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeChats}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Waiting</dt>
                  <dd className="text-lg font-medium text-gray-900">{waitingChats}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Chats</dt>
                  <dd className="text-lg font-medium text-gray-900">{chats.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="waiting">Waiting</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="lastMessage">Last Message</option>
                <option value="created">Created Date</option>
                <option value="customer">Customer Name</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Chats List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredChats.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/admin/support/chats/${chat.id}`}
                className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {chat.customerName}
                          </p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              chat.status
                            )}`}
                          >
                            {chat.status}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                              chat.priority
                            )}`}
                          >
                            {chat.priority}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {chat.unreadCount > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {chat.unreadCount} new
                            </span>
                          )}
                          <p className="text-sm text-gray-500">{formatTime(chat.lastMessageTime)}</p>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-900 truncate">{chat.subject}</p>
                        <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>{chat.customerEmail}</span>
                        {chat.assignedTo && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Assigned to {chat.assignedTo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {filteredChats.length === 0 && (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No chats found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'No customer chats yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}