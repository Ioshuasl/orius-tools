import { Search, Activity, Network, FileSpreadsheet } from 'lucide-react';
import { StatsCard } from '../StatsCard';
import type { RegistroTabelaEmolumentos } from '../../types'; // Alterado para o novo tipo

export function TabelaStats({ registros }: { registros: RegistroTabelaEmolumentos[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Agora as estatísticas são calculadas diretamente do array do banco de dados */}
      <StatsCard title="Registros" value={registros.length} icon={Activity} />
      <StatsCard title="Sistemas" value={new Set(registros.map(i => i.sistema)).size} icon={Search} />
      <StatsCard title="Agrupadores" value={registros.filter(i => i.id_selo_combinado).length} icon={Network} />
      <StatsCard title="Atos" value={registros.filter(i => i.ato).length} icon={FileSpreadsheet} />
    </div>
  );
}