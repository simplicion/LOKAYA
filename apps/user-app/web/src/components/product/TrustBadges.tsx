import { ProductTrustBadge } from '@/lib/mock/products';
import { Star, ShieldCheck, Clock, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgesProps {
  badges?: ProductTrustBadge[];
}

export function TrustBadges({ badges }: TrustBadgesProps) {
  if (!badges || badges.length === 0) return null;

  const getIcon = (name: string, className: string) => {
    switch (name) {
      case 'star': return <Star className={className} />;
      case 'shield-check': return <ShieldCheck className={className} />;
      case 'clock': return <Clock className={className} />;
      case 'shield': return <Shield className={className} />;
      case 'zap': return <Zap className={className} />;
      default: return <Check className={className} />;
    }
  };

  return (
    <div className="flex divide-x divide-gray-200 border-y border-gray-100 bg-gray-50/50 py-3">
      {badges.map((badge, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <div className="flex items-center gap-1.5 mb-1">
            {getIcon(badge.icon, "w-4 h-4 text-[#FF6B00]")}
            <span className="text-sm font-bold text-gray-900">{badge.title}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight">{badge.subtitle}</span>
        </div>
      ))}
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
