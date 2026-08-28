"use client";

import { useGetMyStoreQuery } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function SellerOrdersPage() {
  const { data: store, isLoading } = useGetMyStoreQuery();

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  // TODO: Add an endpoint in backend to fetch orders for a specific store.
  // For now, we mock the UI.
  const orders = [
    { id: 'ORD-1234', customer: 'John Doe', status: 'PENDING', total: 45.99, date: '2023-10-24' },
    { id: 'ORD-1235', customer: 'Jane Smith', status: 'SHIPPED', total: 120.50, date: '2023-10-23' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-zinc-500">Manage fulfillment and track order statuses.</p>
        </div>
      </div>

      <div className="rounded-md border border-zinc-200">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Order ID</th>
                <th scope="col" className="px-6 py-3 font-medium">Date</th>
                <th scope="col" className="px-6 py-3 font-medium">Customer</th>
                <th scope="col" className="px-6 py-3 font-medium">Total</th>
                <th scope="col" className="px-6 py-3 font-medium">Status</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="bg-white border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-6 py-4 font-semibold text-zinc-900">{order.id}</td>
                  <td className="px-6 py-4 text-zinc-500">{order.date}</td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4 font-medium">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-900 font-medium">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
