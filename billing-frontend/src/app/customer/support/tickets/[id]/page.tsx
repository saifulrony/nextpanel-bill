'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TicketIcon,
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface TicketComment {
  id: string;
  text: string;
  author: string;
  authorType: 'customer' | 'support';
  timestamp: Date;
  attachments?: string[];
}

interface TicketPageProps {
  params: {
    id: string;
  };
}

export default function TicketPage({ params }: TicketPageProps) {
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticket, setTicket] = useState({
    id: params.id,
    subject: 'Unable to access my domains',
    status: 'open',
    priority: 'high',
    category: 'Domain Management',
    created: new Date('2024-01-15T10:30:00'),
    lastUpdate: new Date('2024-01-15T14:30:00'),
    description: 'I am unable to access my domain management panel. When I try to log in, I get an error message saying "Access Denied". I have tried clearing my browser cache and using different browsers, but the issue persists.',
    attachments: ['screenshot1.png', 'error_log.txt'],
  });

  const [comments, setComments] = useState<TicketComment[]>([
    {
      id: '1',
      text: 'Thank you for reporting this issue. I can see that you are experiencing access problems with your domain management panel. Let me investigate this for you.',
      author: 'Sarah Johnson',
      authorType: 'support',
      timestamp: new Date('2024-01-15T11:00:00'),
    },
    {
      id: '2',
      text: 'I have checked your account and found that there was a temporary permission issue. I have resolved this and you should now be able to access your domain management panel. Please try logging in again and let me know if you still experience any issues.',
      author: 'Sarah Johnson',
      authorType: 'support',
      timestamp: new Date('2024-01-15T14:30:00'),
    },
  ]);

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const comment: TicketComment = {
      id: Date.now().toString(),
      text: newComment,
      author: 'You',
      authorType: 'customer',
      timestamp: new Date(),
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    setIsSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
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
              <TicketIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Created {ticket.created.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <PaperClipIcon className="h-4 w-4 mr-2" />
                        <a href="#" className="text-indigo-600 hover:text-indigo-900">
                          {attachment}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
              
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {comment.author}
                      </span>
                      <span className="text-xs text-gray-500">
                        {comment.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Add a comment</h4>
                <div className="space-y-3">
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Add your comment..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ticket ID</dt>
                  <dd className="text-sm text-gray-900">{ticket.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="text-sm text-gray-900">{ticket.category}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">{ticket.created.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Update</dt>
                  <dd className="text-sm text-gray-900">{ticket.lastUpdate.toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  Start Live Chat
                </button>
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Request Update
                </button>
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Close Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
