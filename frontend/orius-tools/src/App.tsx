import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import Home from './pages/Home';
import CentralAuditoria from './pages/CentralAuditoria';
import ComparadorGuias from './pages/ComparadorGuias';
import TabelaEmolumentos from './pages/TabelaEmolumentos';
import ComunidadeSuporte from './pages/ComunidadeSuporte';
import EditorComunidade from './pages/EditorComunidade';
import CepCensec from './pages/CepCensec';
import CesdiCensec from './pages/CesdiCensec';
import RctoCensec from './pages/RctoCensec';
import Doi from './pages/Doi';

const APP_TITLES: Record<string, string> = {
  '/': 'Painel de Controlo',
  '/comparador-guias': 'Comparador de Guias',
  '/tabela-emolumentos': 'Tabela de Emolumentos',
  '/auditoria': 'Central de Auditoria',
  '/auditoria/cep': 'Validador CENSEC / CEP',
  '/auditoria/cesdi': 'Validador CENSEC / CESDI',
  '/auditoria/rcto': 'Validador CENSEC / RCTO',
  '/auditoria/doi': 'Validador DOI',
  '/comunidade': 'Comunidade de Suporte',
  '/assinatura-digital': 'Assinatura Digital',
  '/configuracoes': 'Configurações',
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout routeTitles={APP_TITLES} />}>
            {/* Dashboard Principal */}
            <Route index element={<Home />} />
            
            <Route path="comparador-guias" element={<ComparadorGuias />} />
            <Route path="tabela-emolumentos" element={<TabelaEmolumentos />} />
            
            {/* Hub de Auditoria e Higienização */}
            <Route path="auditoria">
              <Route index element={<CentralAuditoria />} />
              <Route path="cep" element={<CepCensec />} />
              <Route path="cesdi" element={<CesdiCensec />} />
              <Route path="rcto" element={<RctoCensec />} />
              <Route path="doi" element={<Doi />} />
            </Route>

            <Route path="comunidade" element={<ComunidadeSuporte />} />
            <Route path="comunidade/editor/:id" element={<EditorComunidade />} />
            
            {/* Redirecionamento de rotas inexistentes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;