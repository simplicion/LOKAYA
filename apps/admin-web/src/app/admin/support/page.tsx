'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Headphones, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Package, 
  Filter, 
  Eye, 
  X, 
  MessageSquare,
  User,
  Calendar
} from 'lucide-react';
import { useGetAdminSupportTicketsQuery, useUpdateAdminSupportTicketMutation } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminSupportTicketsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch } = useGetAdminSupportTicketsQuery({
    status: statusFilter,
    priority: priorityFilter,
    category: categoryFilter,
    search: searchQuery,
  });

  const [updateTicket, { isLoading: isUpdating }] = useUpdateAdminSupportTicketMutation();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState('OPEN');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [adminNotes, setAdminNotes] = useState('');

  const tickets = data?.tickets || [];
  const counts = data?.counts || { total: 0, open: 0, inProgress: 0, resolved: 0 };

  const handleOpenDetail = (ticket: any) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setAdminNotes(ticket.adminNotes || '');
  };

  const handleSaveResolution = async () => {
    if (!selectedTicket) return;

    try {
      await updateTicket({
        ticketId: selectedTicket.id,
        status: editStatus,
        priority: editPriority,
        adminNotes: adminNotes.trim() || undefined,
      }).unwrap();

      toast.success(`Ticket #${selectedTicket.ticketNumber} updated successfully`);
      setSelectedTicket(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update ticket');
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <Headphones className="w-8 h-8 text-blue-600" />
            Support Tickets Center
          </h2>
          <p className="text-gray-500 mt-1">Review, prioritize, and resolve user customer service and order complaints.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Tickets</span>
            <Headphones className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{counts.total}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex justify-between items-center text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Open Tickets</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700">{counts.open}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex justify-between items-center text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span>In Progress</span>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-blue-700">{counts.inProgress}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex justify-between items-center text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">{counts.resolved}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ticket #, user, subject or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="ALL">All Categories</option>
          <option value="ORDER">Order Issues</option>
          <option value="PAYMENT">Payment & Refund</option>
          <option value="DELIVERY">Delivery Delay</option>
          <option value="SELLER">Store / Seller</option>
          <option value="ACCOUNT">Account & Security</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length > 0 ? (
                tickets.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 text-xs">
                      {t.ticketNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 text-xs">{t.user?.name || 'Customer'}</div>
                      <div className="text-[11px] text-gray-500">{t.user?.email || t.user?.phone || 'No contact'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                        {t.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-gray-900 truncate text-xs">{t.subject}</div>
                      <div className="text-[11px] text-gray-500 truncate mt-0.5">{t.description}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        t.priority === 'URGENT' ? 'bg-red-50 text-red-700 border border-red-200' :
                        t.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        t.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        t.status === 'OPEN' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(t)}
                        className="text-xs font-semibold hover:border-blue-500 hover:text-blue-600"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Headphones className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-800">No Support Tickets Found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                      No customer support requests match your current filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    {selectedTicket.ticketNumber}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">{selectedTicket.category}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h3>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info Card */}
            <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 text-xs">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                {selectedTicket.user?.name ? selectedTicket.user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="font-bold text-gray-900">{selectedTicket.user?.name || 'Customer'}</div>
                <div className="text-gray-500 truncate">{selectedTicket.user?.email} • {selectedTicket.user?.phone || 'No phone'}</div>
              </div>
              {selectedTicket.orderId && (
                <div className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 font-mono text-[11px]">
                  Order: {selectedTicket.orderId}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Problem Description</label>
              <div className="bg-gray-50/80 p-3.5 rounded-2xl text-xs text-gray-800 leading-relaxed border border-gray-100">
                {selectedTicket.description}
              </div>
            </div>

            {/* Status & Priority Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Ticket Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Priority Level</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>Resolution Message / Admin Note</span>
                <span className="text-[11px] text-gray-400 font-normal">Visible to customer on their ticket</span>
              </label>
              <textarea
                rows={3}
                placeholder="Write response or resolution details for the customer..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveResolution} 
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Save Resolution
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
