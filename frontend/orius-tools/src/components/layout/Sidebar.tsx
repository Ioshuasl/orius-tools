import { NavLink } from 'react-router-dom';
import {
  Home,
  FileSearch,
  FileSpreadsheet,
  ShieldCheck,
  MessagesSquare,
  Phone,
  Activity,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

export function Sidebar() {
  const menuItems = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/comparador-guias', label: 'Comparador de Guias', icon: FileSearch },
    { path: '/tabela-emolumentos', label: 'Tabela de Emolumentos', icon: FileSpreadsheet },
    { path: '/auditoria', label: 'Central de Auditoria', icon: ShieldCheck },
    { path: '/comunidade', label: 'Comunidade Suporte', icon: MessagesSquare },
  ];
  const handleCopy = (text: string, label: string) => {
    // Copia apenas os números para a área de transferência
    navigator.clipboard.writeText(text.replace(/\D/g, ''));
    toast.success(`${label} copiado para a área de transferência!`);
  };

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
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
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

      {/* Rodapé da Sidebar - Atendimento ORIUS */}
      <div className="mt-auto px-2 pb-4 space-y-4">
        <div className="px-3 pt-4">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Contato Suporte Orius
          </p>

          <div className="space-y-[2px]">
            <button
              onClick={() => handleCopy("(62) 98516-6406", "Whatsapp")}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] text-[#37352f]/70 dark:text-[#d3d3d3]/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors group"
            >
              <MessagesSquare size={16} className="text-green-600/70" />
              <span className="font-medium truncate group-hover:text-[#37352f] dark:group-hover:text-white transition-colors">Whatsapp</span>
              <Copy size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
            </button>

            <button
              onClick={() => handleCopy("(62) 3954-9600", "Fixo")}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] text-[#37352f]/70 dark:text-[#d3d3d3]/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors group"
            >
              <Phone size={16} className="text-orange-600/70" />
              <span className="font-medium truncate group-hover:text-[#37352f] dark:group-hover:text-white transition-colors">Telefone Fixo</span>
              <Copy size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}