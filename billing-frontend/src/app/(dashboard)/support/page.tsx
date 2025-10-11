'use client';

import { useState, useEffect } from 'react';
import { supportAPI } from '@/lib/api';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await supportAPI.listTickets();
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
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
      alert('Support ticket created successfully!');
      setNewTicket({ subject: '', description: '', priority: 'medium', category: 'general' });
      setShowNewTicket(false);
      loadTickets();
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
      loadTicketDetails(selectedTicket.id);
    } catch (error) {
      alert('Failed to add reply');
    }
  };

  const closeTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to close this ticket?')) return;
    
    try {
      await supportAPI.closeTicket(ticketId);
      alert('Ticket closed successfully');
      loadTickets();
      setSelectedTicket(null);
    } catch (error) {
      alert('Failed to close ticket');
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            <p className="mt-2 text-sm text-gray-600">
              Get help from our support team
            </p>
          </div>
          <button
            onClick={() => setShowNewTicket(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Create New Ticket
          </button>
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
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Submit Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tickets List / Ticket Details */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {selectedTicket ? (
            // Ticket Details View
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-indigo-600 hover:text-indigo-900 mb-2"
                  >
                    ← Back to tickets
                  </button>
                  <h3 className="text-lg font-medium text-gray-900">{selectedTicket.subject}</h3>
                  <p className="text-sm text-gray-500">Ticket #{selectedTicket.ticket_number}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTicket.status === 'open' ? 'bg-green-100 text-green-800' :
                    selectedTicket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedTicket.status}
                  </span>
                  {selectedTicket.status !== 'closed' && (
                    <button
                      onClick={() => closeTicket(selectedTicket.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Close Ticket
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-700 mb-6">{selectedTicket.description}</p>

                <h4 className="font-medium mb-4">Replies</h4>
                <div className="space-y-4 mb-6">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg ${reply.is_staff ? 'bg-blue-50' : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">
                          {reply.is_staff ? 'Support Team' : 'You'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{reply.message}</p>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== 'closed' && (
                  <form onSubmit={addReply}>
                    <textarea
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mb-2"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Send Reply
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            // Tickets List View
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Tickets
              </h3>

              {isLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : tickets.length === 0 ? (
                <p className="text-center py-12 text-gray-500">
                  No support tickets yet. Create one if you need help!
                </p>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => loadTicketDetails(ticket.id)}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{ticket.subject}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            #{ticket.ticket_number} • Created {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

