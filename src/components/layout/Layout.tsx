import { type ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  hideNav?: boolean;
}

export function Layout({ children, className, hideNav = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header mobile */}
      <div className="md:hidden">
        <Header />
      </div>

      {/* Sidebar desktop */}
      <Sidebar />

      {/* Conteúdo principal */}
      <main
        className={cn(
          'md:ml-64 min-h-screen',
          !hideNav && 'pb-20 md:pb-0',
          className
        )}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 md:py-6">
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      {!hideNav && <BottomNav />}
    </div>
  );
}
