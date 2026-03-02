import { Font } from '@react-pdf/renderer';

export const registerNotaryFonts = () => {
  // --- TIMES NEW ROMAN (Equivalente: Tinos do Google Fonts) ---
  Font.register({
    family: 'Times New Roman',
    fonts: [
      { src: 'https://fonts.gstatic.com/s/tinos/v14/u-470qu9zPuxSXRCSOfC.ttf' }, // normal
      { src: 'https://fonts.gstatic.com/s/tinos/v14/u-4z0qu9zPuxSXR_Y7mPC_E.ttf', fontStyle: 'italic' },
      { src: 'https://fonts.gstatic.com/s/tinos/v14/u-480qu9zPuxSXRCSM_iaf8.ttf', fontWeight: 'bold' },
      { src: 'https://fonts.gstatic.com/s/tinos/v14/u-4_0qu9zPuxSXR_Y7mPHO6vVf8.ttf', fontWeight: 'bold', fontStyle: 'italic' },
    ],
  });

  // --- ARIAL / HELVETICA (Equivalente: Arimo do Google Fonts) ---
  Font.register({
    family: 'Arial',
    fonts: [
      { src: 'https://fonts.gstatic.com/s/arimo/v28/P5sMzZCDf9_T_10axCg.ttf' }, // normal
      { src: 'https://fonts.gstatic.com/s/arimo/v28/P5sOzZCDf9_T_10axCj6_f0.ttf', fontStyle: 'italic' },
      { src: 'https://fonts.gstatic.com/s/arimo/v28/P5sMzZCDf9_T_10axCg.ttf', fontWeight: 'bold' }, // bold
    ],
  });

  // --- REGISTRO DOS ALIASES (O que o HTML costuma pedir) ---
  
  // Serif -> Mapeia para o Tinos (Times)
  Font.register({
    family: 'serif',
    fonts: [
      { src: 'https://fonts.gstatic.com/s/tinos/v14/u-470qu9zPuxSXRCSOfC.ttf' },
      { src: 'https://fonts.gstatic.com/s/tinos/v14/u-4z0qu9zPuxSXR_Y7mPC_E.ttf', fontStyle: 'italic' },
    ]
  });

  // Sans-serif / Helvetica Neue -> Mapeia para o Arimo (Arial)
  Font.register({
    family: 'sans-serif',
    src: 'https://fonts.gstatic.com/s/arimo/v28/P5sMzZCDf9_T_10axCg.ttf'
  });

  Font.register({
    family: 'Helvetica Neue',
    src: 'https://fonts.gstatic.com/s/arimo/v28/P5sMzZCDf9_T_10axCg.ttf'
  });

  Font.register({
    family: 'Helvetica',
    src: 'https://fonts.gstatic.com/s/arimo/v28/P5sMzZCDf9_T_10axCg.ttf'
  });

  console.log('✅ Fontes do Google carregadas com sucesso para o PDF');
};