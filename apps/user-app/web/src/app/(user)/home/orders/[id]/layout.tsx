export function generateStaticParams() {
  return [
    { id: 'ORD13345' },
    { id: 'ORD13344' },
    { id: 'ORD12343' },
    { id: 'ORD12342' }
  ];
}

export default function OrderDetailsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
