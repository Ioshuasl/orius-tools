// AtoPartList.tsx
export const AtoPartList = ({ partes }: { partes: any[] }) => (
    <div>
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Partes no Arquivo</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {partes.map((p, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-900/30">
                    <span className="text-[10px] font-black text-orange-500 block mb-1">{p.qualidade}</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{p.nome}</span>
                </div>
            ))}
        </div>
    </div>
);