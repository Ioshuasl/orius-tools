import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { importMinutaService } from '../services/api';
import type { MinutaImportResponse } from '../types';

const NotaryEditor: React.FC = () => {
  const editorRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [variaveis, setVariaveis] = useState<string[]>([]);
  const [dadosPreenchimento, setDadosPreenchimento] = useState<Record<string, string>>({});

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const response: MinutaImportResponse = await importMinutaService(file);
      if (editorRef.current) {
        editorRef.current.setContent(response.html);
      }
      setVariaveis(response.variaveis);
    } catch (error) {
      console.error("Erro na importação:", error);
      alert("Erro ao importar minuta. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  const handleQualificar = () => {
    if (!editorRef.current) return;

    let content = editorRef.current.getContent();
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    const spans = doc.querySelectorAll('.variable-tag');
    spans.forEach((span) => {
      const variableName = span.getAttribute('data-variable');
      if (variableName && dadosPreenchimento[variableName]) {
        span.textContent = dadosPreenchimento[variableName];
      }
    });

    editorRef.current.setContent(doc.body.innerHTML);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#e0e0e0' }}>
      {/* Painel de Variáveis Notariais */}
      <div style={{ width: '380px', padding: '25px', borderRight: '1px solid #ccc', backgroundColor: '#fff', overflowY: 'auto', boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#333' }}>Editor Notarial</h2>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Importar Minuta (.RTF)</label>
          <input type="file" accept=".rtf" onChange={handleFileImport} disabled={loading} style={{ fontSize: '12px' }} />
        </div>
        
        <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />
        
        {variaveis.length > 0 ? (
          <div>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>Campos Identificados</h4>
            {variaveis.map((v) => (
              <div key={v} style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: v.includes('«a»') ? '#e65100' : '#1976d2', display: 'block', marginBottom: '4px' }}>
                  {v}
                </label>
                <input
                  type="text"
                  placeholder={`Valor para ${v.split('«')[0]}`}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }}
                  onChange={(e) => setDadosPreenchimento({ ...dadosPreenchimento, [v]: e.target.value })}
                />
              </div>
            ))}
            <button 
              onClick={handleQualificar}
              style={{ width: '100%', padding: '14px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
            >
              Qualificar Documento
            </button>
          </div>
        ) : (
          <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>Aguardando importação de arquivo...</p>
        )}
      </div>

      {/* Área do Editor com Simulação A4 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
        <Editor
          apiKey="sny4ncto4hf42akdz2eqss2tqd0loo439vfttpuydjc2kqpi"
          onInit={(evt, editor) => editorRef.current = editor}
          init={{
            width: '210mm',
            min_height: '297mm',
            menubar: 'file edit view insert format tools table help',
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount', 'noneditable', 'pagebreak'
            ],
            toolbar: 'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | pagebreak | removeformat | help',
            noneditable_class: 'variable-tag',
            
            // Configuração visual para simular páginas A4 reais
            content_style: `
              body { 
                background-color: #f0f0f0; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                padding: 10px;
                font-family: "Times New Roman", serif;
              }
              .mce-content-body {
                background: white;
                width: 210mm;
                min-height: 297mm;
                padding: 30mm 20mm 20mm 30mm; /* Margens clássicas de cartório */
                margin: 0 auto 20px auto;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                box-sizing: border-box;
                font-size: 12pt;
                line-height: 1.5;
              }
              .variable-tag { 
                background-color: #e3f2fd; 
                border-bottom: 1px solid #2196f3; 
                color: #0d47a1; 
                padding: 0 2px;
                cursor: help;
              }
              .tag-auto { background-color: #fff3e0; border-bottom-color: #ff9800; color: #e65100; }
              
              /* Estilização da quebra de página visual */
              .mce-pagebreak {
                cursor: default;
                display: block;
                border: none;
                width: 100%;
                height: 50px;
                background: #f0f0f0;
                margin: 20px 0;
                position: relative;
                box-shadow: none;
              }
              .mce-pagebreak::before {
                content: "QUEBRA DE PÁGINA (PÁGINA SEGUINTE)";
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 9px;
                color: #aaa;
                font-family: sans-serif;
                letter-spacing: 3px;
              }

              @media print {
                body { background: none; padding: 0; }
                .mce-content-body { box-shadow: none; margin: 0; width: 100%; }
                .mce-pagebreak { page-break-before: always; height: 0; margin: 0; background: none; }
              }
            `
          }}
        />
      </div>
    </div>
  );
};

export default NotaryEditor;