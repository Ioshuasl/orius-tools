import React, { useMemo } from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import Html from 'react-pdf-html';
import { registerNotaryFonts } from '../utils/registerFonts';

// Executa o registro das fontes uma única vez fora do componente
registerNotaryFonts();

const styles = StyleSheet.create({
  page: {
    paddingTop: '30mm',
    paddingBottom: '20mm',
    paddingLeft: '30mm',
    paddingRight: '20mm',
    backgroundColor: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    fontSize: 9,
    bottom: 25,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#999999',
  },
});

const htmlStylesheet = {
  // Fallback global: se nada for especificado, usa Times
  '*': { fontFamily: 'Times New Roman' },
  body: { fontSize: '12pt', lineHeight: 1.5 },
  p: { textAlign: 'justify', marginBottom: '10pt' },
  b: { fontWeight: 'bold' },
  strong: { fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', margin: '10pt 0' },
  td: { border: '0.5pt solid #000', padding: '4pt' },
  '.variable-tag': { backgroundColor: '#E3F2FD', color: '#0D47A1', fontWeight: 'bold' },
  '.tag-auto': { backgroundColor: '#FFF3E0', color: '#E65100' }
};

interface Props {
  htmlContent: string;
}

export const MinutaPDFDocument: React.FC<Props> = ({ htmlContent }) => {
  
  const sanitizedHtml = useMemo(() => {
    if (!htmlContent) return '';
    
    return htmlContent
      // 🔥 CORREÇÃO DO ERRO NaN: Remove porcentagens e unidades cm/in em estilos inline
      .replace(/line-height:[^;"]*%/g, 'line-height: 1.4')
      .replace(/margin-[^;"]*:[^;"]*(?:cm|in|pt|%)/g, '')
      .replace(/text-indent:[^;"]*;/g, '')
      // Higienização de Fontes: Força o uso das famílias que registramos
      .replace(/font-family:[^;"]*serif/gi, 'font-family: serif')
      .replace(/font-family:[^;"]*sans-serif/gi, 'font-family: sans-serif')
      .replace(/face="[^"]*"/gi, 'style="font-family: Times New Roman;"')
      // Limpeza de tags legadas
      .replace(/<font/gi, '<span').replace(/<\/font>/gi, '</span>')
      // Remove cores brancas (comum em conversão do Word/LibreOffice)
      .replace(/color:\s?#ffffff/gi, 'color: #000000');
  }, [htmlContent]);

  return (
    <Document title="Minuta de Ato Notarial">
      <Page size="A4" style={styles.page}>
        <Html stylesheet={htmlStylesheet}>
          {sanitizedHtml}
        </Html>
        <View style={styles.footer} fixed>
          <Text render={({ pageNumber, totalPages }) => `Folha ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};