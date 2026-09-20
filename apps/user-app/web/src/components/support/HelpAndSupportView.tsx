'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  HelpCircle, 
  PlusCircle, 
  Ticket, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Send, 
  Loader2,
  Package,
  CreditCard,
  Truck,
  Store,
  ShieldAlert
} from 'lucide-react';
import { useCreateSupportTicketMutation, useGetMySupportTicketsQuery } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TabType = 'faqs' | 'raise' | 'tickets';

const FAQ_ITEMS = [
  {
    q: 'How can I track the delivery status of my order?',
    a: 'You can track your orders in real-time by going to My Orders > Track Order. You will see whether the store has confirmed, packed, or dispatched your parcel.'
  },
  {
    q: 'What is the return and refund policy on Lokaya?',
    a: 'Eligible items can be returned within the return window specified on the product page. Refunds for online payments are processed back to your original payment method within 3-5 business days.'
  },
  {
    q: 'Can I cancel an order after placing it?',
    a: 'Yes, orders can be cancelled directly from the order details page before the merchant marks the package as out for delivery.'
  },
  {
    q: 'How do I contact a seller directly?',
    a: 'On each store profile page, you will find store operating hours, phone number, and physical store address. You can also chat directly from the product page.'
  }
];

const CATEGORIES = [
  { id: 'ORDER', label: 'Order Issue', icon: Package },
  { id: 'PAYMENT', label: 'Payment & Refund', icon: CreditCard },
  { id: 'DELIVERY', label: 'Delivery Delay', icon: Truck },
  { id: 'SELLER', label: 'Store / Seller Issue', icon: Store },
  { id: 'ACCOUNT', label: 'Account & Security', icon: ShieldAlert },
  { id: 'OTHER', label: 'Other Inquiries', icon: HelpCircle },
];

const PRIORITIES = [
  { id: 'LOW', label: 'Low' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'HIGH', label: 'High' },
  { id: 'URGENT', label: 'Urgent' },
];

function HelpAndSupportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get('orderId');
  const queryTab = searchParams.get('tab') as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(queryTab && ['faqs', 'raise', 'tickets'].includes(queryTab) ? queryTab : queryOrderId ? 'raise' : 'faqs');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Form State
  const [category, setCategory] = useState(queryOrderId ? 'ORDER' : 'ORDER');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [orderId, setOrderId] = useState(queryOrderId || '');
  const [subject, setSubject] = useState(queryOrderId ? `Issue with Order #${queryOrderId.slice(0, 8)}` : '');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (queryOrderId) {
      setOrderId(queryOrderId);
      setCategory('ORDER');
      if (!subject) {
        setSubject(`Issue with Order #${queryOrderId.slice(0, 8)}`);
      }
      setActiveTab('raise');
    } else if (queryTab && ['faqs', 'raise', 'tickets'].includes(queryTab)) {
      setActiveTab(queryTab);
    }
  }, [queryOrderId, queryTab]);

  // API Hooks
  const [createTicket, { isLoading: isSubmitting }] = useCreateSupportTicketMutation();
  const { data: ticketsResponse, isLoading: isLoadingTickets } = useGetMySupportTicketsQuery();
  const myTickets = ticketsResponse?.data || [];

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Please provide a subject for your ticket');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    try {
      const res = await createTicket({
        category,
        priority,
        orderId: orderId.trim() || undefined,
        subject: subject.trim(),
        description: description.trim()
      }).unwrap();

      toast.success(`Support Ticket #${res.data.ticketNumber} created successfully`);
      setSubject('');
      setDescription('');
      setOrderId('');
      setActiveTab('tickets');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit support ticket');
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24 max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-50 px-4 py-3.5 border-b border-[#E5E2DC] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => router.back()} 
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#171717] hover:bg-gray-100 active:scale-95 transition-all -ml-1 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
          </button>
          <h1 className="text-lg font-bold text-[#171717]">Help & Support</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E5E2DC] px-4 py-2 sticky top-[53px] z-40">
        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('faqs')}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              activeTab === 'faqs' ? "bg-white text-[#171717] shadow-xs" : "text-[#6B6B6B] hover:text-[#171717]"
            )}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQs & Contact</span>
          </button>

          <button
            onClick={() => setActiveTab('raise')}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              activeTab === 'raise' ? "bg-white text-[#FF5A36] shadow-xs" : "text-[#6B6B6B] hover:text-[#171717]"
            )}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Raise Ticket</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative",
              activeTab === 'tickets' ? "bg-white text-[#171717] shadow-xs" : "text-[#6B6B6B] hover:text-[#171717]"
            )}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>My Tickets</span>
            {myTickets.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF5A36] text-white text-[10px] font-bold flex items-center justify-center">
                {myTickets.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: FAQs & Contact */}
      {activeTab === 'faqs' && (
        <div className="flex-1 px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
          {/* Quick Contact Cards */}
          <div className="grid grid-cols-2 gap-3">
            <a 
              href="tel:+918001234567" 
              className="bg-white p-4 rounded-3xl border border-[#E5E2DC] shadow-xs flex flex-col items-center text-center gap-2 hover:border-gray-300 transition-colors"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#171717] block">Call Helpline</span>
                <span className="text-[11px] text-[#6B6B6B]">1800-123-4567</span>
              </div>
            </a>

            <a 
              href="mailto:support@lokaya.in" 
              className="bg-white p-4 rounded-3xl border border-[#E5E2DC] shadow-xs flex flex-col items-center text-center gap-2 hover:border-gray-300 transition-colors"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#171717] block">Email Support</span>
                <span className="text-[11px] text-[#6B6B6B]">support@lokaya.in</span>
              </div>
            </a>
          </div>

          {/* Need specific help banner */}
          <div className="bg-gradient-to-r from-orange-500 to-[#FF5A36] rounded-3xl p-5 text-white shadow-sm flex items-center justify-between">
            <div className="space-y-1 pr-2">
              <h3 className="font-bold text-base">Have an Issue with an Order?</h3>
              <p className="text-xs text-white/90">Raise a support ticket for prioritized resolution within 24 hours.</p>
            </div>
            <button
              onClick={() => setActiveTab('raise')}
              className="px-4 py-2 bg-white text-[#FF5A36] text-xs font-bold rounded-full shadow-sm hover:bg-orange-50 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              Raise Ticket
            </button>
          </div>

          {/* FAQs List */}
          <div className="bg-white rounded-3xl p-4 border border-[#E5E2DC] shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-[#171717] px-2 pt-1 mb-2">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className="border border-gray-100 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left text-xs font-bold text-[#171717] hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <span className="pr-2">{item.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-[#FF5A36] shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3.5 pt-1 text-xs text-[#6B6B6B] leading-relaxed border-t border-gray-50">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Raise a Support Ticket */}
      {activeTab === 'raise' && (
        <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
          <form onSubmit={handleSubmitTicket} className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#171717]">Raise a Support Ticket</h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Please provide specific details so our support team can assist you quickly.</p>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#171717]">Issue Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer",
                        isSelected 
                          ? "border-[#FF5A36] bg-orange-50/70 text-[#FF5A36] font-bold ring-1 ring-[#FF5A36]/30" 
                          : "border-gray-200 bg-gray-50/50 text-[#171717] hover:bg-gray-100"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#171717]">Priority Level</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPriority(p.id as any)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                      priority === p.id 
                        ? "bg-[#171717] text-white border-[#171717]" 
                        : "bg-gray-50 border-gray-200 text-[#6B6B6B] hover:bg-gray-100"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Order ID (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#171717] flex justify-between">
                <span>Related Order ID</span>
                <span className="text-[11px] font-normal text-[#6B6B6B]">
                  {orderId ? 'Linked' : 'Optional'}
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. d45e7330-e729-4a19-bf17-1cdacaefd007"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#FF5A36] transition-colors"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#171717]">Subject *</label>
              <input
                type="text"
                required
                placeholder="Brief summary of the problem"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#FF5A36] transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#171717]">Detailed Description *</label>
              <textarea
                required
                rows={4}
                placeholder="Please describe what happened, expected outcome, or any reference info..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#FF5A36] transition-colors resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#FF5A36] text-white font-bold text-xs rounded-2xl shadow-md hover:bg-[#e04d2d] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: My Tickets */}
      {activeTab === 'tickets' && (
        <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
          {isLoadingTickets ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-[#E5E2DC] animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : myTickets.length > 0 ? (
            <div className="space-y-3.5">
              {myTickets.map((ticket: any) => {
                const isResolved = ticket.status === 'RESOLVED';
                const isOpen = ticket.status === 'OPEN';
                const isInProgress = ticket.status === 'IN_PROGRESS';

                return (
                  <div key={ticket.id} className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#171717] bg-gray-100 px-2 py-0.5 rounded-md">
                          {ticket.ticketNumber}
                        </span>
                        <span className="text-[11px] font-semibold text-[#6B6B6B]">
                          {ticket.category}
                        </span>
                      </div>

                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        isOpen && "bg-orange-50 text-[#FF5A36] border border-orange-200/60",
                        isInProgress && "bg-blue-50 text-blue-600 border border-blue-200/60",
                        isResolved && "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
                        ticket.status === 'CLOSED' && "bg-gray-100 text-gray-600"
                      )}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#171717]">{ticket.subject}</h4>
                      <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">{ticket.description}</p>
                    </div>

                    {ticket.orderId && (
                      <div className="text-[11px] text-[#6B6B6B] flex items-center gap-1 bg-gray-50 p-2 rounded-xl">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        <span>Order ID: <strong className="text-[#171717]">{ticket.orderId}</strong></span>
                      </div>
                    )}

                    {ticket.adminNotes && (
                      <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Admin Resolution Note:</span>
                        </div>
                        <p className="text-xs text-emerald-900 leading-relaxed">{ticket.adminNotes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                      <span>Priority: <strong>{ticket.priority}</strong></span>
                      <span>Created: {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-[#FF5A36] shadow-sm">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#171717] mb-1">No Support Tickets</h3>
              <p className="text-xs text-[#6B6B6B] max-w-xs mb-6">
                You currently have no active or previous support requests.
              </p>
              <button
                onClick={() => setActiveTab('raise')}
                className="px-6 py-2.5 bg-[#FF5A36] text-white text-xs font-bold rounded-full shadow-md hover:bg-[#e04d2d] transition-colors cursor-pointer"
              >
                Raise a Ticket
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpAndSupportView() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading Support...</span>
      </div>
    }>
      <HelpAndSupportContent />
    </Suspense>
  );
}
