'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ticket, CheckCircle2, Package, Plus } from 'lucide-react';
import { useGetMySupportTicketsQuery } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function SupportTicketsPage() {
  const router = useRouter();
  const { data: ticketsResponse, isLoading } = useGetMySupportTicketsQuery();
  const tickets = ticketsResponse?.data || [];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24">
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
          <h1 className="text-lg font-bold text-[#171717]">Support Tickets</h1>
        </div>

        <button
          onClick={() => router.push('/profile/help')}
          className="px-3 py-1.5 bg-[#FF5A36] text-white text-xs font-bold rounded-full shadow-xs hover:bg-[#e04d2d] flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-[#E5E2DC] animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-3.5">
            {tickets.map((ticket: any) => {
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
              You haven't submitted any support requests yet.
            </p>
            <button
              onClick={() => router.push('/profile/help')}
              className="px-6 py-2.5 bg-[#FF5A36] text-white text-xs font-bold rounded-full shadow-md hover:bg-[#e04d2d] transition-colors cursor-pointer"
            >
              Raise a Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
