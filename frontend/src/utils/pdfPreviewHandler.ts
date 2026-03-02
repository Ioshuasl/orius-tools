// src/utils/pdfPreviewHandler.ts
import * as pdfjsLib from 'pdfjs-dist';

/**
 * IMPORTANTE: No Vite/React moderno, importamos o worker assim para evitar 404.
 * Isso empacota o worker junto com o seu código local.
 */
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const generatePdfThumbnail = async (file: File): Promise<string | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Configuração da tarefa de carregamento
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      // Desativa o uso de workers externos se o import acima falhar por algum motivo
      useWorkerFetch: false, 
      isEvalSupported: false 
    });

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    // Definimos a escala (1.5 para melhor nitidez no thumbnail)
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) throw new Error("Erro ao criar contexto do Canvas");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas // Propriedade exigida pela versão 5.x
    };

    await page.render(renderContext).promise;

    // Retornamos em formato WebP ou JPEG (WebP é mais leve para o banco de dados)
    return canvas.toDataURL('image/webp', 0.7);
  } catch (error) {
    console.error("Erro detalhado ao gerar thumbnail:", error);
    return null;
  }
};