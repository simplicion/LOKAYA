export function generateStaticParams() {
  return [{ id: 'ORD12345' }];
}

export default function OrderIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
