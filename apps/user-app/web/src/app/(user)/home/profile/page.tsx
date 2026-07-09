'use client';

import { useRouter } from 'next/navigation';
import { 
  User, 
  MapPin, 
  CreditCard, 
  Settings, 
  LogOut, 
  ChevronRight,
  PackageSearch,
  Bell
} from 'lucide-react';
import Link from 'next/link';

const menuItems = [
  { id: 'orders', label: 'My Orders', icon: <PackageSearch className="w-5 h-5" />, href: '/home/orders' },
  { id: 'address', label: 'Address Book', icon: <MapPin className="w-5 h-5" />, href: '/home/address' },
  { id: 'payments', label: 'Payment Methods', icon: <CreditCard className="w-5 h-5" />, href: '/home/payments' },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, href: '/home/notifications' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/home/settings' },
];

export default function ProfilePage() {
  const router = useRouter();

  const handleLogout = () => {
    // Implement logout logic here
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-32">
      {/* Header Profile Info */}
      <div className="flex flex-col items-center justify-center pt-8 pb-6 border-b border-gray-100">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600 shadow-inner">
          <User className="w-12 h-12" />
        </div>
        <h1 className="font-bold text-gray-900 text-2xl mb-1">Jane Doe</h1>
        <p className="text-gray-500 font-medium text-sm">+91 98765 43210</p>
      </div>

      {/* Menu List */}
      <div className="flex flex-col px-3 pt-6 gap-2">
        {menuItems.map((item) => (
          <Link key={item.id} href={item.href}>
            <div className="flex items-center justify-between py-4 border-b border-gray-50 hover:bg-gray-50 rounded-xl px-2 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="font-semibold text-gray-800 text-base">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
        ))}

        {/* Log Out Button */}
        <div 
          onClick={handleLogout}
          className="flex items-center justify-between py-4 mt-4 border border-red-100 bg-red-50 hover:bg-red-100 rounded-xl px-3 transition-colors cursor-pointer text-red-600"
        >
          <div className="flex items-center gap-4">
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-base">Log Out</span>
          </div>
        </div>
      </div>
    </div>
  );
}

