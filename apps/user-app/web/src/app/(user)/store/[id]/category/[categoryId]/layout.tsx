export function generateStaticParams() {
  return [
    { id: '1', categoryId: '1' },
    { id: '2', categoryId: '2' },
    { id: '3', categoryId: '3' },
  ];
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
