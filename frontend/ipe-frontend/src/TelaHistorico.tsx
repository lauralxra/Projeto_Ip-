import { useState } from "react";
import { NavBar } from './NavBar';
import { User } from './UserBar';
import { type Log, Historico } from './dados/logs';
import { Imagens } from './config/assets';
import { Plus, Trash2, Edit3, MessageSquare, UserPlus } from 'lucide-react';
import { NucleosCadastrados } from "./dados/nucleos";

// Função auxiliar para renderizar o ícone dinâmico da ação do log
function IconeAcao({ acao }: { acao: string }) {
  // Adicao
  let IconComponent = Plus;
  if (acao == 'Edicao') {
    IconComponent = Edit3;
  } else if (acao == 'Exclusao') {
    IconComponent = Trash2;
  } else if (acao == 'Cadastro') {
    IconComponent = UserPlus;
  } else if (acao == 'Resposta') {
    IconComponent = MessageSquare;
  }

  return (
    <div className="size-[42px] bg-[#fbd3ee]/80 rounded-full flex items-center justify-center shrink-0">
      <IconComponent size={20} className="text-[#a13680]" />
    </div>
  );
}

function LinhaLog({ logEmSi }: { logEmSi: Log }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-between gap-4 shadow-xs hover:shadow-md transition-shadow w-full">
      
      {/* Detalhes da Ação */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <IconeAcao acao={logEmSi.tipo} />
        
        <div className="flex flex-col min-w-0">
          <p className="font-semibold text-[14px] text-[#a13680] truncate">
            {logEmSi.acao}
          </p>
          <p className="text-[12px] text-slate-600 truncate">
            {logEmSi.descricao}
          </p>
        </div>
      </div>

      {/* Individuo */}
      <div className="flex items-left gap-3 flex-1 min-w-[400px] max-w-[400px] justify-start">
        <div className="size-[38px] relative rounded-full overflow-hidden border border-slate-200 shrink-0">
          <img 
            alt={logEmSi.individuo.nome} 
            className="size-full object-cover" 
            src={logEmSi.individuo.imagem ? "/src/assets/"+logEmSi.individuo.imagem : Imagens.DefaultPFP} 
          />
        </div>
        
        <div className="flex flex-col min-w-0 relative">
          <p className="font-semibold text-[13px] text-[#a13680] px-1 truncate">
            {logEmSi.individuo.nome}
          </p>
          <span className="inline-block text-black text-[10px] font-bold px-1 py-0.5 rounded-full w-fit">
            {logEmSi.individuo.tipo}
          </span>
        </div>
      </div>

      {/* Data e Hora */}
      <div className="flex flex-col items-end text-[12px] text-[#a13680] font-medium shrink-0 min-w-[90px]">
        <span>{new Date(logEmSi.data).toLocaleDateString('pt-BR')}</span>
        <span className="text-slate-400 text-[11px]">{new Date(logEmSi.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

    </div>
  );
}

export default function TelaHistorico() {
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [nucleoSelecionado, setNucleoSelecionado] = useState('');

    // Lógica para filtrar e ordenar os logs (Mais recentes primeiro por padrão)
    const logsFiltrados = [...Historico].filter((log) => {
        const dataLog = new Date(log.data);
        
        // Filtro de Data Início
        if (dataInicio) {
          const inicio = new Date(dataInicio + 'T00:00:00');
          if (dataLog < inicio) return false;
        }

        // Filtro de Data Fim
        if (dataFim) {
          const fim = new Date(dataFim + 'T23:59:59');
          if (dataLog > fim) return false;
        }

        // Filtro de Núcleo (Verifica se o tipo do indivíduo ou descrição bate com o núcleo selecionado)
        if (nucleoSelecionado) {
          const matchTipo = log.individuo.tipo?.toLowerCase() === nucleoSelecionado.toLowerCase();
          const matchDescricao = log.descricao?.toLowerCase().includes(nucleoSelecionado.toLowerCase());
          if (!matchTipo && !matchDescricao) return false;
        }

        return true;
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()); // Ordena do mais recente para o mais antigo

    return(
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            <NavBar />

            {/*================ CONTEÚDO PRINCIPAL =================*/}
            <main className="flex-1 p-6 h-full overflow-y-auto pt-[70px]">
              <div className="flex flex-col gap-6 items-center pt-[10px] pb-[10px] w-full h-full mx-auto">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4 px-2">
                  
                  {/* Top */}
                  <div>
                    <h1 className="text-3xl font-['Google_Sans_Flex:Regular',sans-serif] font-normal relative shrink-0 text-[#a13680] w-full">
                      Histórico
                    </h1>
                    <p className="font-['Google_Sans_Flex:Light',sans-serif] font-light relative shrink-0 text-[#8e8e93] w-full text-sm text-slate-500 mt-1">
                      Acompanhe o histórico de edições, movimentações e quem realizou cada ação.
                    </p>
                  </div>

                  {/* control */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    
                    {/* núcleos */}
                    <select
                      value={nucleoSelecionado}
                      onChange={(e) => setNucleoSelecionado(e.target.value)}
                      className="bg-white border border-[#a13680] px-3 py-1.5 rounded-xl h-[40px] text-xs font-bold text-slate-700 outline-none cursor-pointer shadow-xs"
                    >
                      <option value="">Todos os Núcleos</option>
                      {NucleosCadastrados.map((n) => (
                        <option key={n.id} value={n.sigla}>{n.nome} ({n.sigla})</option>
                      ))}
                    </select>

                    {/* datas */}
                    <div className="flex items-center gap-2 bg-white border border-[#a13680] px-3 py-1.5 rounded-xl h-[40px] text-xs text-slate-700 shadow-xs">
                      <input 
                        type="date" 
                        value={dataInicio} 
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="outline-none bg-transparent cursor-pointer"
                      />
                      <span>até</span>
                      <input 
                        type="date" 
                        value={dataFim} 
                        onChange={(e) => setDataFim(e.target.value)}
                        className="outline-none bg-transparent cursor-pointer"
                      />
                    </div>

                    {/* limpa filtros */}
                    {(dataInicio || dataFim || nucleoSelecionado) && (
                      <button 
                        onClick={() => { setDataInicio(''); setDataFim(''); setNucleoSelecionado(''); }}
                        className="text-xs text-[#a13680] underline cursor-pointer font-semibold"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                </div>

                {/* lista em si */}
                <div className="bg-white border border-[#a13680]/30 rounded-2xl p-4 sm:p-6 flex flex-col gap-3 w-full shadow-xs">
                  {logsFiltrados.length > 0 ? (
                    logsFiltrados.map((log, index) => (
                      <LinhaLog key={log.id || index} logEmSi={log} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                      Nenhum registro encontrado.
                    </div>
                  )}
                </div>

              </div>
            </main>
            
            {/* ==================== BARRA DO USUÁRIO ========================== */}
            <div className="absolute h-[60px] right-0 top-0 w-auto" data-name="userbar">
                <div className="flex flex-row justify-end max-w-[inherit] min-w-[inherit] size-full">
                    <div className="content-stretch flex items-start justify-end max-w-[inherit] min-w-[inherit] relative size-full">
                      <User />
                    </div>
                </div>
            </div>
        </div>
    );
}