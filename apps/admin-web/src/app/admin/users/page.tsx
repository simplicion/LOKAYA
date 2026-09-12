'use client';

import { useState } from 'react';
import { useGetUsersQuery } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, ShieldCheck, User, Store, Mail, Phone, Calendar, RefreshCw } from 'lucide-react';

export default function UsersManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading, refetch, isFetching } = useGetUsersQuery();

  const filteredUsers = users?.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q))
    );
  }) || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Manage registered buyers, sellers, and system administrators</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Users: {users?.length || 0}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Auth Provider</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Linked Store</th>
                <th className="px-5 py-3.5">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Loading users list...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const store = u.stores?.[0]?.store;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-5 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{u.name}</div>
                            <div className="text-[11px] text-gray-400 font-mono">{u.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4 text-gray-600">
                        <div className="space-y-0.5">
                          {u.email && (
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {u.email}
                            </div>
                          )}
                          {u.phone && (
                            <div className="flex items-center gap-1.5 text-gray-500 font-mono">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {u.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Auth Provider */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.authProvider === 'GOOGLE' ? 'bg-red-50 text-red-700 border border-red-200' :
                          u.authProvider === 'PHONE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {u.authProvider}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        {u.isSystemAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            <User className="w-3.5 h-3.5 text-gray-500" />
                            Buyer / User
                          </span>
                        )}
                      </td>

                      {/* Linked Store */}
                      <td className="px-5 py-4">
                        {store ? (
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-orange-600" />
                            <span className="font-semibold text-gray-900">{store.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              store.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                              store.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {store.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-4 text-gray-500 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
