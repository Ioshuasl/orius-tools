import { NavLink } from 'react-router-dom';
import { FileSearch, Home, Activity, FileSpreadsheet, ShieldCheck } from 'lucide-react';

export function Sidebar() {
  const menuItems = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/comparador-guias', label: 'Comparador de Guias', icon: FileSearch },
    { path: '/tabela-emolumentos', label: 'Tabela de Emolumentos', icon: FileSpreadsheet },
    { path: '/validar-censec', label: 'Validador CENSEC', icon: ShieldCheck } // <-- Adicione o item no menu
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col hidden md:flex shrink-0 shadow-sm z-20 transition-colors duration-200">
      {/* Logotipo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-700">
        <Activity className="text-orange-500 mr-2" size={24} />
        <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
          Orius<span className="text-orange-500">Tools</span>
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cartório Logado</p>
          <p className="text-sm text-gray-900 dark:text-gray-100 font-bold truncate">Tabelionato de Notas</p>
        </div>
      </div>
    </aside>
  );
}