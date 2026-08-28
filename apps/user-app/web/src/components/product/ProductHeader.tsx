interface ProductHeaderProps {
  title: string;
  subtitle?: string;
  price: number;
  originalPrice?: number;
  discountLabel?: string;
}

export function ProductHeader({ title, subtitle, price, originalPrice, discountLabel }: ProductHeaderProps) {
  const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

  return (
    <div className="px-4 py-4 space-y-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-gray-900">{formatPrice(price)}</span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through font-medium">{formatPrice(originalPrice)}</span>
          )}
          {discountLabel && (
            <span className="text-xs font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-sm uppercase tracking-wide">
              {discountLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-[#208b5e] font-medium">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          Inclusive of all taxes
        </div>
      </div>
    </div>
  );
}
