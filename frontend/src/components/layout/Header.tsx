import { useLocation } from 'react-router-dom';
import { Bell, User, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  routeTitles: Record<string, string>;
}

export function Header({ routeTitles }: HeaderProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const currentTitle = routeTitles[location.pathname] || 'Visão Geral';

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0 shadow-sm z-10 sticky top-0 transition-colors duration-200">
      
      <div className="flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
        <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">
          {currentTitle}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Toggle Theme Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-400 hover:text-orange-500 dark:text-gray-300 dark:hover:text-orange-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" 
          title={theme === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button className="p-2 text-gray-400 hover:text-orange-500 dark:text-gray-300 dark:hover:text-orange-400 transition-colors relative rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
        </button>
        
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
        
        <button className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
          <div className="bg-orange-100 dark:bg-orange-900/50 p-1.5 rounded-full text-orange-600 dark:text-orange-400">
            <User size={16} />
          </div>
          <span className="hidden sm:inline">Usuário</span>
        </button>
      </div>
    </header>
  );
}