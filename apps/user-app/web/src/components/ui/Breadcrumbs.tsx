import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import Script from 'next/script';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumbs({ items, className = '', showHome = true }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = showHome 
    ? [{ label: 'Home', href: '/home' }, ...items]
    : items;

  const schemaItems = allItems.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    ...(item.href ? { item: item.href.startsWith('http') ? item.href : `https://lokaya.shop${item.href}` } : {})
  }));

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: schemaItems
  };

  return (
    <>
      <Script
        id={`breadcrumb-schema-${allItems.map(i => i.label).join('-').slice(0, 30)}`}
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav aria-label="Breadcrumb" className={`w-full overflow-x-auto no-scrollbar py-2 ${className}`}>
        <ol className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            return (
              <li key={index} className="inline-flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
                )}
                {isLast || !item.href ? (
                  <span 
                    className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-[300px]"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-[#FF5A36] transition-colors flex items-center gap-1 text-gray-600 font-medium"
                  >
                    {index === 0 && showHome && <Home className="w-3 h-3 text-gray-400 mr-0.5" />}
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
