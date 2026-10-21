import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  FolderKanban, 
  BarChart3, 
  MessageSquare, 
  History, 
  Bell, 
  User, 
  Download, 
  ChevronDown,
  TrendingUp,
  Users
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

// Dados MOCK para os gráficos
const dadosEvolucao = [
  { mes: 'Jan', atendimentos: 500 },
  { mes: 'Fev', atendimentos: 650 },
  { mes: 'Mar', atendimentos: 780 },
  { mes: 'Abr', atendimentos: 720 },
  { mes: 'Mai', atendimentos: 950 },
  { mes: 'Jun', atendimentos: 1248 },
];

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

export default function Dashboard() {
  const [nucleoFiltro, setNucleoFiltro] = useState('Todos os Núcleos');
  const [periodoFiltro, setPeriodoFiltro] = useState('Últimos 12 meses');

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-[#3a182d] text-white flex flex-col justify-between p-6 hidden md:flex shrink-0">
        <div>
          {/* Logo IPÊ */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 rounded-full bg-[#fce8f3]/20 flex items-center justify-center text-xl">
              🌸
            </div>
            <span className="font-bold text-xl tracking-wide">IPÊ</span>
          </div>

          {/* Menu de Navegação */}
          <nav className="space-y-2">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white font-medium transition-colors">
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>
            <Link to="/nucleos" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
              <Layers size={20} />
              <span>Núcleos</span>
            </Link>
            <a href="#programas" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
              <FolderKanban size={20} />
              <span>Programas</span>
            </a>
            <a href="#indicadores" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
              <BarChart3 size={20} />
              <span>Indicadores</span>
            </a>
            <a href="#forum" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
              <MessageSquare size={20} />
              <span>Fórum</span>
            </a>
            <a href="#historico" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
              <History size={20} />
              <span>Histórico</span>
            </a>
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="text-xs text-white/50 px-2">
          Instituto IPÊ • UFRPE
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* Cabeçalho do Dashboard */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-serif">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
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
                <option>NEI</option>
                <option>NURI</option>
                <option>NINTA</option>
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

            {/* Notificação e Usuário */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <button className="p-2 text-slate-600 hover:text-[#832b62] transition-colors cursor-pointer">
                <Bell size={20} />
              </button>
              <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
                <div className="w-8 h-8 rounded-full bg-[#fce8f3] text-[#832b62] flex items-center justify-center">
                  <User size={16} />
                </div>
                <span>Usuário</span>
              </div>
            </div>
          </div>
        </header>

        {/* Grade de Cards Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          <div className="bg-[#fcf2f7] p-5 rounded-2xl border border-[#f5e1ed] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#832b62] text-white flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-800">1.248</span>
              <p className="text-xs text-slate-500 font-medium">Total de Pessoas Atendidas</p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp size={12} /> +12% em relação ao mês anterior
              </span>
            </div>
          </div>

          <div className="bg-[#f0f4f9] p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#9d4b7b]/20 text-[#832b62] flex items-center justify-center shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-800">4</span>
              <p className="text-xs text-slate-500 font-medium">Núcleos em atividade</p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp size={12} /> +1% em relação ao mês anterior
              </span>
            </div>
          </div>

          <div className="bg-[#f0f4f9] p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#9d4b7b]/20 text-[#832b62] flex items-center justify-center shrink-0">
              <FolderKanban size={22} />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-800">35</span>
              <p className="text-xs text-slate-500 font-medium">Programas em Execução</p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp size={12} /> +5% em relação ao mês anterior
              </span>
            </div>
          </div>

          <div className="bg-[#fcf2f7] p-5 rounded-2xl border border-[#f5e1ed] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#832b62] text-white flex items-center justify-center shrink-0">
              <BarChart3 size={22} />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-800">32</span>
              <p className="text-xs text-slate-500 font-medium">Indicadores cadastrados</p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp size={12} /> +2% em relação ao mês anterior
              </span>
            </div>
          </div>

        </div>

        {/* Seção de Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px]">
            <h3 className="text-base font-bold text-slate-800 mb-1">Evolução do Número de Pessoas Atendidas</h3>
            <p className="text-xs text-slate-400 mb-6">Últimos 6 meses</p>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="corAtendimentos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#832b62" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#832b62" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="atendimentos" stroke="#832b62" strokeWidth={3} fillOpacity={1} fill="url(#corAtendimentos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

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
    </div>
  );
}