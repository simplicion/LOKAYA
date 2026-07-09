export function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: 'p1' },
    { id: 'p2' },
    { id: 'p3' },
    { id: 'p4' },
    { id: '%5Bid%5D' },
    { id: '[id]' }
  ];
}

export default function ProductIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
