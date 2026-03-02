import { Hash } from "lucide-react";
import type { Artigo } from "../../types";

export const ArtigoCard: React.FC<{ art: Artigo }> = ({ art }) => (
  <div className="p-5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 border-l-4 border-l-orange-500 rounded-r-2xl mb-4 transition-all hover:shadow-md">
    <div className="flex items-center gap-2 mb-3">
      <div className="bg-orange-100 dark:bg-orange-900/20 p-1.5 rounded-lg text-orange-600 dark:text-orange-400">
        <Hash size={14} />
      </div>
      <span className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-widest">Artigo {art.numero}</span>
    </div>
    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-semibold mb-4">{art.texto}</p>
    
    <div className="space-y-3">
      {art.paragrafos?.map((p, idx) => (
        <div key={idx} className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 py-1 text-sm text-gray-500 dark:text-gray-400 italic">
          <span className="font-black text-gray-800 dark:text-gray-200 not-italic mr-1">{p.id}</span> {p.texto}
        </div>
      ))}
      {art.incisos?.map((i, idx) => (
        <div key={idx} className="ml-4 flex gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-black text-orange-500 min-w-[20px]">{i.id} -</span> {i.texto}
        </div>
      ))}
    </div>
  </div>
);