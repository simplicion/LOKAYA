"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Star, Loader2, MessageSquare, Store, Search } from "lucide-react";
import { useGetAdminReviewsQuery, useDeleteAdminReviewMutation } from "@/lib/api";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const { data: reviews = [], isLoading, refetch } = useGetAdminReviewsQuery();
  const [deleteAdminReview, { isLoading: isDeleting }] = useDeleteAdminReviewMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | 'ALL'>('ALL');

  const filteredReviews = reviews.filter((r: any) => {
    if (selectedRating !== 'ALL' && r.rating !== selectedRating) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchStore = (r.storeName || '').toLowerCase().includes(q);
      const matchProduct = (r.product || '').toLowerCase().includes(q);
      const matchComment = (r.comment || '').toLowerCase().includes(q);
      const matchUser = (r.user || '').toLowerCase().includes(q);
      return matchStore || matchProduct || matchComment || matchUser;
    }
    return true;
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1)
    : "0.0";
  const fiveStarCount = reviews.filter((r: any) => r.rating === 5).length;
  const criticalCount = reviews.filter((r: any) => (r.rating || 0) <= 2).length;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this customer review?")) {
      return;
    }

    try {
      await deleteAdminReview(id).unwrap();
      toast.success("Review deleted successfully");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete review");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Reviews Moderation</h2>
          <p className="text-gray-500 mt-1">Manage and moderate customer product & store reviews across all stores.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Reviews</div>
          <div className="text-2xl font-bold text-gray-900">{totalReviews}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Avg Platform Rating</div>
          <div className="text-2xl font-bold text-amber-600 flex items-center gap-1">
            {avgRating} <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-200 bg-green-50/20 shadow-sm">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">5-Star Reviews</div>
          <div className="text-2xl font-bold text-green-600">{fiveStarCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm">
          <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Critical (1-2 Stars)</div>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search store, product, comment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 5, 4, 3, 2, 1] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRating(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedRating === r
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r === 'ALL' ? (
                'All Ratings'
              ) : (
                <span className="flex items-center gap-1">
                  <span>{r}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200 rounded-xl">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
          <span className="text-xs font-medium text-gray-500">Loading reviews...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">No Reviews Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            {searchQuery || selectedRating !== 'ALL'
              ? 'No reviews match your search or filter criteria.'
              : 'There are currently no reviews submitted on the platform.'}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase">Store & Product</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase">Comment</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReviews.map((review: any) => (
                <tr key={review.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{review.product}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Store className="w-3 h-3" /> {review.storeName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-700">
                    {review.user}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-0.5 text-xs font-bold">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-100 text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-1.5 text-gray-600 font-medium">({review.rating})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-sm">
                    <p className="text-xs text-gray-700 line-clamp-2" title={review.comment}>
                      {review.comment || <span className="text-gray-400 italic">(No comment text)</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8"
                      onClick={() => handleDelete(review.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
