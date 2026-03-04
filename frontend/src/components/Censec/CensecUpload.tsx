import { FileCode, Search, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface CesdiUploadProps {
    title: React.ReactNode;
    description: string;
    icon: LucideIcon;
    file: File | null;
    loading: boolean;
    onProcess: (file: File) => void;
    onValidate: () => void;
}

export const CensecUpload = ({ 
    title, 
    description, 
    icon: Icon, 
    file, 
    loading, 
    onProcess, 
    onValidate 
}: CesdiUploadProps) => {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onProcess(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center min-h-[80vh] p-6">
            <div className="max-w-xl w-full space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 rounded-3xl bg-orange-500/10 text-orange-600">
                        <Icon size={48} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight uppercase">
                        {title}
                    </h1>
                    <p className="text-gray-500 font-medium px-12 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 p-8 space-y-6">
                    <div 
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative flex flex-col items-center justify-center py-16 px-6 border-4 border-dashed rounded-[2rem] transition-all group ${
                            dragActive ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200 dark:border-gray-700 hover:border-orange-400/50'
                        }`}
                    >
                        <input 
                            type="file" 
                            accept=".xml" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            onChange={(e) => e.target.files && onProcess(e.target.files[0])} 
                        />
                        <FileCode size={64} className={`${file ? 'text-orange-500' : 'text-gray-300'} mb-4`} />
                        <h3 className="text-xl font-bold">{file ? file.name : 'Selecione o XML'}</h3>
                        <p className="text-sm text-gray-400 mt-1">Arraste o arquivo aqui ou clique para procurar</p>
                    </div>

                    <button 
                        onClick={onValidate} 
                        disabled={loading || !file} 
                        className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Activity className="animate-spin" /> : <Search size={20} />}
                        {loading ? 'Processando...' : 'Iniciar Conferência'}
                    </button>
                </div>
            </div>
        </div>
    );
};