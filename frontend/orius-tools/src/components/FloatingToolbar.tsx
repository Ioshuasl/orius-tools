import { useEffect, useState, useCallback } from 'react';
import { Bold, Italic, Underline, Pipette } from 'lucide-react';

interface FloatingToolbarProps {
    position: { top: number; left: number } | null;
    isVisible: boolean;
}

export function FloatingToolbar({ position, isVisible }: FloatingToolbarProps) {
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false
    });

    // Cores institucionais para o suporte
    const colors = [
        { name: 'Padrão', color: 'inherit' },
        { name: 'Cinza', color: '#6b7280' },
        { name: 'Vermelho', color: '#ef4444' },
        { name: 'Laranja', color: '#f97316' },
        { name: 'Verde', color: '#22c55e' },
        { name: 'Azul', color: '#3b82f6' },
        { name: 'Roxo', color: '#a855f7' },
    ];

    // Verifica o estado de formatação da seleção atual
    const updateActiveFormats = useCallback(() => {
        if (isVisible) {
            setActiveFormats({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
            });
        }
    }, [isVisible]);

    useEffect(() => {
        if (isVisible) {
            updateActiveFormats();
        } else {
            setShowColorPicker(false);
        }
    }, [isVisible, position, updateActiveFormats]);

    if (!isVisible || !position) return null;

    const handleFormat = (command: string, value?: string) => {
        // Executa o comando de formatação nativo
        document.execCommand(command, false, value);
        
        // Atualiza o estado visual da toolbar imediatamente
        updateActiveFormats();
        
        if (value) setShowColorPicker(false);
    };

    return (
        <div 
            className="fixed z-50 flex flex-col items-center animate-in fade-in zoom-in duration-150" 
            style={{ 
                top: position.top - 55, 
                left: position.left, 
                transform: 'translateX(-50%)' 
            }}
            // IMPORTANTE: Impede que o clique na toolbar tire o foco do texto selecionado
            onMouseDown={(e) => e.preventDefault()}
        >
            {/* Menu de Cores Suspenso */}
            {showColorPicker && (
                <div className="mb-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 grid grid-cols-4 gap-1 animate-in slide-in-from-bottom-2 duration-200">
                    {colors.map((c) => (
                        <button
                            key={c.name}
                            onClick={() => handleFormat('foreColor', c.color)}
                            className="w-7 h-7 rounded-full border border-gray-100 dark:border-gray-600 transition-transform hover:scale-110 active:scale-90"
                            style={{ backgroundColor: c.color === 'inherit' ? '#9ca3af' : c.color }}
                            title={c.name}
                        />
                    ))}
                </div>
            )}

            {/* Toolbar Principal */}
            <div className="flex items-center bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-1 gap-0.5">
                <ToolbarButton 
                    onClick={() => handleFormat('bold')} 
                    icon={<Bold size={16} />} 
                    isActive={activeFormats.bold} 
                    label="Negrito (Ctrl+B)" 
                />
                <ToolbarButton 
                    onClick={() => handleFormat('italic')} 
                    icon={<Italic size={16} />} 
                    isActive={activeFormats.italic} 
                    label="Itálico (Ctrl+I)" 
                />
                <ToolbarButton 
                    onClick={() => handleFormat('underline')} 
                    icon={<Underline size={16} />} 
                    isActive={activeFormats.underline} 
                    label="Sublinhado (Ctrl+U)" 
                />

                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                <ToolbarButton
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    icon={<Pipette size={16} />}
                    isActive={showColorPicker}
                    label="Cor do Texto"
                />
            </div>
            
            {/* Setinha para baixo (Pointer) */}
            <div className="w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rotate-45 -mt-1.5 shadow-sm"></div>
        </div>
    );
}

interface ToolbarButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
}

function ToolbarButton({ onClick, icon, label, isActive }: ToolbarButtonProps) {
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`p-2 rounded-md transition-all flex items-center justify-center ${
                isActive
                    ? 'bg-orange-500 text-white shadow-inner'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'
            }`}
            title={label}
        >
            {icon}
        </button>
    );
}