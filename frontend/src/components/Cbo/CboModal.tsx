import React, { useEffect, useState } from 'react';
import { X, Briefcase, Hash, Type, Layers, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createCboService, updateCboService } from '../../services/api';
import type { Cbo as CboType } from '../../types';

interface CboModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cboToEdit: CboType | null;
}

export default function CboModal({ isOpen, onClose, onSuccess, cboToEdit }: CboModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CboType>>({
    codigo: '',
    titulo: '',
    tipo: 'Ocupação'
  });

  useEffect(() => {
    if (cboToEdit) {
      setFormData(cboToEdit);
    } else {
      setFormData({ codigo: '', titulo: '', tipo: 'Ocupação' });
    }
  }, [cboToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (cboToEdit?.id) {
        await updateCboService(cboToEdit.id, formData);
        toast.success('Profissão atualizada com sucesso');
      } else {
        await createCboService(formData);
        toast.success('Nova profissão cadastrada');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Erro ao salvar registro', {
        description: error.response?.data?.details || 'Verifique os dados e tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Container do Modal com Animação de Zoom e Subida */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Briefcase size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {cboToEdit ? 'Editar CBO' : 'Novo Registro CBO'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Campo Código */}
          <div className="space-y-1.5 group">
            <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              <Hash size={14} className="group-focus-within:text-orange-500 transition-colors" />
              Código CBO
            </label>
            <input
              required
              type="text"
              placeholder="Ex: 6125-10"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-700 dark:text-gray-200 transition-all font-mono placeholder:font-sans"
            />
          </div>

          {/* Campo Título */}
          <div className="space-y-1.5 group">
            <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              <Type size={14} className="group-focus-within:text-orange-500 transition-colors" />
              Título Profissional
            </label>
            <textarea
              required
              rows={3}
              placeholder="Digite o nome completo da ocupação..."
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-700 dark:text-gray-200 transition-all resize-none"
            />
          </div>

          {/* Campo Tipo */}
          <div className="space-y-1.5 group">
            <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              <Layers size={14} className="group-focus-within:text-orange-500 transition-colors" />
              Tipo de Registro
            </label>
            <div className="relative">
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-700 dark:text-gray-200 appearance-none cursor-pointer transition-all"
              >
                <option value="Ocupação">Ocupação</option>
                <option value="Sinônimo">Sinônimo</option>
                <option value="Família">Família</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Layers size={16} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm active:scale-95"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}