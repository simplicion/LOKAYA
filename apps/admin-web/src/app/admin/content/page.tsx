"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldAlert, CheckCircle } from "lucide-react";

export default function AdminContentPage() {
  // Mock data for prototype
  const [posts, setPosts] = useState([
    { id: '1', type: 'Reel', storeName: 'FashionHub', caption: 'Check out our new summer collection! ☀️ #fashion', status: 'REPORTED', reports: 3 },
    { id: '2', type: 'Post', storeName: 'TechStore', caption: 'Latest headphones available now.', status: 'ACTIVE', reports: 0 },
    { id: '3', type: 'Reel', storeName: 'ScamStore', caption: 'Click link in bio for free money!!!', status: 'REPORTED', reports: 12 },
  ]);

  const handleAction = (id: string, newStatus: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, status: newStatus, reports: newStatus === 'ACTIVE' ? 0 : p.reports } : p));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Moderation</h2>
          <p className="text-gray-500 mt-1">Review reported Reels and Posts from sellers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Cards */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Reported</div>
          <div className="text-3xl font-bold text-red-600">
            {posts.filter(p => p.status === 'REPORTED').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Actions Taken (24h)</div>
          <div className="text-3xl font-bold text-gray-900">12</div>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Store</th>
              <th className="px-6 py-3 font-medium">Content / Caption</th>
              <th className="px-6 py-3 font-medium text-center">Reports</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                    post.type === 'Reel' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {post.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {post.storeName}
                </td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={post.caption}>
                  {post.caption}
                </td>
                <td className="px-6 py-4 text-center">
                  {post.reports > 0 ? (
                    <span className="flex items-center justify-center text-red-600 font-bold">
                      <ShieldAlert className="w-4 h-4 mr-1" /> {post.reports}
                    </span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    post.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {post.status === 'REPORTED' && (
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleAction(post.id, 'ACTIVE')}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Clear
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(post.id, 'REMOVED')}>
                    <Trash2 className="w-4 h-4 mr-1" /> Takedown
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
