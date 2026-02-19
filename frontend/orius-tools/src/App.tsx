import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

import { AppLayout } from './components/layout/AppLayout';
import ComparadorGuias from './pages/ComparadorGuias';
import { ThemeProvider } from './contexts/ThemeContext'; // <-- Adicionado
import TabelaEmolumentos from './pages/TabelaEmolumentos';
import CepCensec from './pages/CepCensec';

const APP_TITLES: Record<string, string> = {
  '/': 'Painel de Controle',
  '/comparador-guias': 'Comparador de Guias',
  '/tabela-emolumentos': 'Tabela de Emolumentos',
  '/validar-censec': 'Validador CENSEC / CEP', // <-- Adicione o título da rota
  '/assinatura-digital': 'Assinatura Digital',
  '/configuracoes': 'Configurações',
};

const Home = () => (
  // Nota: Adicionei classes dark: aqui para a Home já responder ao tema
  <div className="h-full flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 transition-colors">
    <div className="text-center space-y-4 animate-in zoom-in-95 duration-500">
      <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-2xl inline-block">
        <Activity size={48} className="text-orange-500 dark:text-orange-400" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bem-vindo ao OriusTools</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        Seu canivete suíço para auditorias e rotinas notariais.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout routeTitles={APP_TITLES} />}>
            <Route index element={<Home />} />
            <Route path="comparador-guias" element={<ComparadorGuias />} />
            <Route path="tabela-emolumentos" element={<TabelaEmolumentos />} /> 
            <Route path="validar-censec" element={<CepCensec />} /> {/* <-- Adicione a nova rota */}
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;