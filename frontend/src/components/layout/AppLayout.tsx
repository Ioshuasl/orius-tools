import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

// Tipagem da Propriedade
interface AppLayoutProps {
  routeTitles: Record<string, string>;
}

export function AppLayout({ routeTitles }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Toaster richColors position="top-right" />
      
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Injetando as props no Header */}
        <Header routeTitles={routeTitles} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}