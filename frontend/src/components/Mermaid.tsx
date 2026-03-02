import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../contexts/ThemeContext'; // Ajuste o caminho conforme sua estrutura

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    // 1. Inicializa as configurações globais do Mermaid baseadas no tema
    mermaid.initialize({
      startOnLoad: true,
      theme: theme === 'dark' ? 'dark' : 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      // Configurações específicas para Diagramas de Entidade-Relacionamento
      er: {
        useMaxWidth: false,
        layoutDirection: 'TB',
        minEntityWidth: 160,
        stroke: theme === 'dark' ? '#4b5563' : '#d1d5db',
        fill: theme === 'dark' ? '#1f2937' : '#ffffff',
      },
    });
  }, [theme]);

  useEffect(() => {
    if (ref.current && chart) {
      // 2. Limpeza do estado anterior do DOM
      // Remove o atributo que impede o Mermaid de processar o mesmo elemento novamente
      ref.current.removeAttribute('data-processed');
      
      // Limpa o SVG antigo para evitar sobreposição visual
      ref.current.innerHTML = chart;
      
      try {
        // 3. Força a biblioteca a renderizar o novo conteúdo
        mermaid.contentLoaded();
      } catch (error) {
        console.error("Erro na renderização do Mermaid:", error);
      }
    }
  }, [chart, theme]); // Reage tanto à mudança de tabela quanto de tema

  return (
    <div 
      // 4. A 'key' dinâmica força o React a remontar o componente no toggle do tema
      key={`mermaid-container-${theme}`}
      className="mermaid w-full flex justify-center py-2 transition-opacity duration-300" 
      ref={ref}
    >
      {chart}
    </div>
  );
}