import React, { useRef, useState, useEffect } from 'react';

interface Props {
  htmlContent: string;
}

const MinutaA4Preview: React.FC<Props> = ({ htmlContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // A4 em 96 DPI: 297mm ≈ 1123px
  const PAGE_HEIGHT_PX = 1122.5; 

  // Calcula o número de páginas sempre que o conteúdo mudar
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      const pages = Math.max(1, Math.ceil(height / PAGE_HEIGHT_PX));
      setTotalPages(pages);
    }
  }, [htmlContent]);

  const scrollToPage = (page: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: (page - 1) * PAGE_HEIGHT_PX,
        behavior: 'smooth'
      });
      setCurrentPage(page);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#525659' }}>
      
      {/* Barra de Navegação de Páginas */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#343a40', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '15px',
        color: 'white',
        fontSize: '13px',
        zIndex: 10,
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}>
        <button 
          onClick={() => scrollToPage(currentPage - 1)} 
          disabled={currentPage === 1}
          style={navButtonStyle}
        > ◀ </button>
        
        <span>Página <strong>{currentPage}</strong> de {totalPages}</span>
        
        <button 
          onClick={() => scrollToPage(currentPage + 1)} 
          disabled={currentPage === totalPages}
          style={navButtonStyle}
        > ▶ </button>
      </div>

      {/* Área de Visualização */}
      <div 
        ref={containerRef}
        style={{ flex: 1, overflowY: 'auto', padding: '40px 0', scrollSnapType: 'y mandatory' }}
      >
        <div 
          ref={contentRef}
          className="shadow-a4"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '30mm 20mm 20mm 30mm',
            backgroundColor: 'white',
            margin: '0 auto',
            boxShadow: '0 0 15px rgba(0,0,0,0.3)',
            boxSizing: 'border-box',
            fontFamily: '"Times New Roman", serif',
            fontSize: '12pt',
            lineHeight: '1.5',
            textAlign: 'justify',
            position: 'relative'
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
        
        {/* Linhas Visuais de Quebra de Página (Apenas para o preview) */}
        <style>{`
          .shadow-a4 { position: relative; }
          .shadow-a4::after {
            content: "";
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            background-image: linear-gradient(to bottom, transparent ${PAGE_HEIGHT_PX - 1}px, #e9ecef ${PAGE_HEIGHT_PX - 1}px, #e9ecef ${PAGE_HEIGHT_PX + 2}px, transparent ${PAGE_HEIGHT_PX + 2}px);
            background-size: 100% ${PAGE_HEIGHT_PX}px;
          }
          .shadow-a4 table { width: 100% !important; border-collapse: collapse; }
          .shadow-a4 td { border: 0.5pt solid #000; padding: 4pt; }
        `}</style>
      </div>
    </div>
  );
};

const navButtonStyle = {
  backgroundColor: '#495057',
  color: 'white',
  border: 'none',
  padding: '5px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold' as 'bold'
};

export default MinutaA4Preview;