import { useState } from 'react';
import { NavBar } from './NavBar';
import { User } from './UserBar';
import {
  FolderKanban, 
  BarChart3,
  Download, 
  ChevronDown,
  TrendingUp,
  Users,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { NucleosCadastrados } from './dados/nucleos';
import { programasCadastrados } from './dados/programas';
import { IndicadoresCadastrados } from './dados/indicadores';
import { UsuariosCadastrados } from './dados/usuarios';
import { TrimestresPassados } from './dados/trimestres';

const dadosComparativo = [
  { nucleo: 'Tecnologia', Pessoas: 85, Projetos: 65, Parcerias: 45 },
  { nucleo: 'Educação', Pessoas: 70, Projetos: 55, Parcerias: 40 },
  { nucleo: 'Meio Ambiente', Pessoas: 60, Projetos: 50, Parcerias: 35 },
  { nucleo: 'Saúde', Pessoas: 75, Projetos: 48, Parcerias: 50 },
  { nucleo: 'Cultura', Pessoas: 65, Projetos: 42, Parcerias: 30 },
  { nucleo: 'Esporte', Pessoas: 58, Projetos: 38, Parcerias: 28 },
  { nucleo: 'Comunicação', Pessoas: 72, Projetos: 52, Parcerias: 42 },
  { nucleo: 'Gestão', Pessoas: 68, Projetos: 46, Parcerias: 38 },
];

function CardMetrica( {TipoMetrica, valAtual, valVariacao, corBg}: {TipoMetrica: string, valAtual:number, valVariacao: number, corBg: string}) {
  let leTitulo = "";
  switch(TipoMetrica)
  {
    case "programas":
      leTitulo = "Programas em Execução"
      break;
    case "indicadores":
      leTitulo = "Indicadores Cadastrados";
      break;
    default:
      leTitulo = "Total de Usuários";
      break;
  }

  let varUsers = valVariacao;

  return(
    <div className={corBg+" w-full h-full p-5 rounded-2xl border border-[#f5e1ed] shadow-sm flex items-center gap-4"}>
      <div className="w-12 h-12 rounded-xl bg-[#832b62] text-white flex items-center justify-center shrink-0">
        {TipoMetrica === "programas" ? <FolderKanban size={22} /> : TipoMetrica === "indicadores" ? <BarChart3 size={22} /> : <Users size={22} /> }
      </div>
      <div>
        <span className="text-2xl font-bold text-slate-800">{valAtual}</span>
        <p className="text-xs text-slate-500 font-medium">{leTitulo}</p>
        <span className={`text-[11px] font-semibold flex items-center gap-1 mt-1 ${varUsers >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {varUsers >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 
          {varUsers >= 0 ? `+${varUsers}%` : `${varUsers}%`} em relação ao período anterior
        </span>
      </div>
    </div>
  );
}

export default function TelaDashboard() {
  const [nucleoFiltro, setNucleoFiltro] = useState('Todos os Núcleos');
  const [periodoFiltro, setPeriodoFiltro] = useState('Últimos 12 meses');
  
  const trimestresArray = Array.from(TrimestresPassados.keys());
  
  const trimestreAnterior = trimestresArray.length > 1 ? trimestresArray[1] : null;

  const calcularVariacao = (atual: number, anterior: number | undefined) => {
    if (!anterior || anterior === 0) return 0;
    return Number(((((atual - anterior) / anterior) * 100)).toFixed(1));
  };

  const varUsers = trimestreAnterior ? calcularVariacao(UsuariosCadastrados.length, trimestreAnterior.quantiaUsers) : 0;
  const varProgramas = trimestreAnterior ? calcularVariacao(programasCadastrados.length, trimestreAnterior.quantiaProgramas) : 0;
  const varIndicadores = trimestreAnterior ? calcularVariacao(IndicadoresCadastrados.length, trimestreAnterior.quantiaIndicadores) : 0;

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      
      {/* Sidebar Lateral */}
      <NavBar></NavBar>

      {/* Conteúdo Principal */}
      <main className="flex-1 px-[30px] w-full h-full overflow-y-auto pt-[60px] pb-[25px]">
        
        {/* Cabeçalho do Dashboard */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-['Google_Sans_Flex:Regular',sans-serif] font-normal relative shrink-0 text-[#a13680] w-full">Dashboard</h1>
            <p className="font-['Google_Sans_Flex:Light',sans-serif] font-light relative shrink-0 text-[#8e8e93] w-full text-sm text-slate-500 mt-1">
              Acompanhe os resultados dos núcleos, programas e indicadores institucionais
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro Núcleos */}
            <div className="relative">
              <select 
                value={nucleoFiltro}
                onChange={(e) => setNucleoFiltro(e.target.value)}
                className="appearance-none bg-[#832b62] text-white text-xs font-medium px-4 py-2.5 pr-8 rounded-lg cursor-pointer focus:outline-none"
              >
                <option>Todos os Núcleos</option>
                {
                  NucleosCadastrados.map((n) => (
                    <option>{n.sigla}</option>
                  ))
                }
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>

            {/* Filtro Período */}
            <div className="relative">
              <select 
                value={periodoFiltro}
                onChange={(e) => setPeriodoFiltro(e.target.value)}
                className="appearance-none bg-[#832b62] text-white text-xs font-medium px-4 py-2.5 pr-8 rounded-lg cursor-pointer focus:outline-none"
              >
                <option>Últimos 12 meses</option>
                <option>Últimos 6 meses</option>
                <option>Ano de 2026</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>

            {/* Botão Exportar CSV */}
            <button className="flex items-center gap-2 bg-[#4a1836] hover:bg-[#3a182d] text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer">
              <Download size={14} />
              <span>Exportar CSV</span>
            </button>
          </div>
        </header>

        {/* Grade de Cards Métricas */}
        <div className="content-stretch flex w-full gap-8 mb-8 h-30">
          
          <CardMetrica TipoMetrica='usuario' valAtual={UsuariosCadastrados.length} valVariacao={varUsers} corBg="bg-[#fcf2f7]"/>

          {/*<CardMetrica TipoMetrica='nucleos' valAtual={NucleosCadastrados.length} valVariacao={varUsers} corBg="bg-[#f0f4f9]"/>*/}

          <CardMetrica TipoMetrica='programas' valAtual={programasCadastrados.length} valVariacao={varProgramas} corBg="bg-[#f0f4f9]"/>

          <CardMetrica TipoMetrica='indicadores' valAtual={IndicadoresCadastrados.length} valVariacao={varIndicadores} corBg="bg-[#fcf2f7]"/>


        </div>

        {/* Seção de Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {IndicadoresCadastrados.map((indicador) => {
            
            {/* Monta os dados históricos do indicador percorrendo o Map de TrimestresPassados */}
            const dadosHistoricoTrimestres = Array.from(TrimestresPassados.entries()).map(([trimestre, listaIndicadores]) => {
              // Procura se este indicador existe no trimestre atual da iteração (comparando pelo nome ou ID)
              const indEncontrado = listaIndicadores.find(i => i.nome === indicador.nome);
              
              return {
                periodo: trimestre.periodo, // Ex: '2025.3', '2026.1', etc.
                valor: indEncontrado ? Number(indEncontrado.valAtual) : 0 // Converte para número para o gráfico aceitar
              };
            }).reverse(); // .reverse() para deixar do mais antigo para o mais recente na linha do tempo do gráfico

            return (
              <div key={indicador.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px]">
                <h3 className="text-base font-bold text-slate-800 mb-1">{indicador.nome}</h3>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosHistoricoTrimestres} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`corIndicador-${indicador.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#832b62" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#832b62" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="periodo" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-md text-xs">
                                <p className="font-bold text-slate-700">{label}</p>
                                <p className="font-semibold text-[#832b62] text-sm mt-0.5">
                                  {payload[0].value} {indicador.simbolUni || ''}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />  
                      <Area type="monotone" dataKey="valor" stroke="#832b62" strokeWidth={3} fillOpacity={1} fill={`url(#corIndicador-${indicador.id})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-800">Comparativo de Indicadores por Núcleo</h3>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
                <button className="px-2.5 py-1 bg-white rounded-md shadow-xs text-[#832b62]">Últimos 6 meses</button>
                <button className="px-2.5 py-1">Mensal</button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-6">Média do período</p>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosComparativo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="nucleo" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#f1f5f9' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Pessoas" fill="#832b62" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Projetos" fill="#b66692" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Parcerias" fill="#e8b2d1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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