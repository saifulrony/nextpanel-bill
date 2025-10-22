'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChatBubbleLeftRightIcon,
  TicketIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'chats' | 'tickets'>('chats');

  // Mock data - replace with real data from API
  const recentChats = [
    {
      id: '1',
      subject: 'Domain registration issue',
      status: 'active',
      lastMessage: 'Thank you for your help!',
      timestamp: '2 minutes ago',
      unread: 0,
    },
    {
      id: '2',
      subject: 'Billing question',
      status: 'resolved',
      lastMessage: 'Issue has been resolved',
      timestamp: '1 hour ago',
      unread: 0,
    },
  ];

  const recentTickets = [
    {
      id: 'TICKET-001',
      subject: 'Unable to access my domains',
      status: 'open',
      priority: 'high',
      created: '2024-01-15',
      lastUpdate: '2 hours ago',
    },
    {
      id: 'TICKET-002',
      subject: 'Payment method not working',
      status: 'in_progress',
      priority: 'medium',
      created: '2024-01-14',
      lastUpdate: '1 day ago',
    },
    {
      id: 'TICKET-003',
      subject: 'Account verification',
      status: 'closed',
      priority: 'low',
      created: '2024-01-10',
      lastUpdate: '3 days ago',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Get help with your account, services, and technical issues.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Start New Chat */}
        <Link
          href="/customer/support/chats/new"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Start New Chat</h3>
                <p className="text-sm text-gray-500">
                  Get instant help from our support team
                </p>
              </div>
            </div>
          </div>
        </Link>

        {/* Create New Ticket */}
        <Link
          href="/customer/support/tickets/new"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TicketIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Create Ticket</h3>
                <p className="text-sm text-gray-500">
                  Submit a detailed support request
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('chats')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'chats'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span>Recent Chats</span>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'tickets'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TicketIcon className="h-5 w-5" />
              <span>Support Tickets</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'chats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Chats</h3>
                <Link
                  href="/customer/support/chats/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Chat
                </Link>
              </div>

              {recentChats.length === 0 ? (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent chats</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start a new chat to get help from our support team.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/customer/support/chats/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Start New Chat
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentChats.map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/customer/support/chats/${chat.id}`}
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {chat.subject}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                chat.status
                              )}`}
                            >
                              {chat.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 truncate">
                            {chat.lastMessage}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4" />
                          <span>{chat.timestamp}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Support Tickets</h3>
                <Link
                  href="/customer/support/tickets/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Ticket
                </Link>
              </div>

              {recentTickets.length === 0 ? (
                <div className="text-center py-8">
                  <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No support tickets</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a new ticket to get help with your issues.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/customer/support/tickets/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create New Ticket
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticket ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Update
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link
                              href={`/customer/support/tickets/${ticket.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {ticket.id}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ticket.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                ticket.status
                              )}`}
                            >
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                                ticket.priority
                              )}`}
                            >
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ticket.lastUpdate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}