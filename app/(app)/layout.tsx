import BottomNav from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24 lg:pb-0 lg:pl-72">
      <BottomNav />
      <main className="px-4 py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto animate-page">
        {children}
      </main>
    </div>
  );
}
