"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AdminReviewsPage() {
  // Mock data for prototype
  const [reviews, setReviews] = useState([
    { id: '1', storeName: 'FreshMart', product: 'Apple', user: 'john@example.com', rating: 1, comment: 'Terrible quality, do not buy!', status: 'FLAGGED' },
    { id: '2', storeName: 'TechStore', product: 'Headphones', user: 'jane@example.com', rating: 5, comment: 'Amazing sound!', status: 'APPROVED' },
    { id: '3', storeName: 'FreshMart', product: 'Banana', user: 'bob@example.com', rating: 2, comment: 'A bit bruised, but okay.', status: 'PENDING' },
  ]);

  const handleAction = (id: string, newStatus: string) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleDelete = (id: string) => {
    setReviews(reviews.filter(r => r.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reviews Moderation</h2>
          <p className="text-gray-500 mt-1">Manage and moderate product reviews across all stores.</p>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-medium">Store & Product</th>
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Rating & Comment</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="font-medium">{review.product}</div>
                  <div className="text-xs text-gray-500">{review.storeName}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {review.user}
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex items-center text-amber-500 mb-1">
                    {"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}
                  </div>
                  <p className="text-gray-700 truncate" title={review.comment}>{review.comment}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    review.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    review.status === 'FLAGGED' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {review.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {review.status !== 'APPROVED' && (
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleAction(review.id, 'APPROVED')}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  )}
                  {review.status !== 'FLAGGED' && (
                    <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleAction(review.id, 'FLAGGED')}>
                      <AlertTriangle className="w-4 h-4 mr-1" /> Flag
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(review.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
