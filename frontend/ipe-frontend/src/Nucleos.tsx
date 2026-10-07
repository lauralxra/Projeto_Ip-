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
  Search, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Camera 
} from 'lucide-react';

interface Nucleo {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
  corBg: string;
  corIcone: string;
  logoTexto?: string;
  iconeEmoji?: string;
}

const dadosIniciais: Nucleo[] = [
  {
    id: '1',
    nome: 'Núcleo de Empreendedorismo',
    sigla: 'NEI',
    descricao: 'Apoio à criação e desenvolvimento de negócios',
    corBg: 'bg-[#5c3a82]',
    corIcone: 'text-white',
    logoTexto: 'NEI'
  },
  {
    id: '2',
    nome: 'Núcleo de Relações Institucionais',
    sigla: 'NURI',
    descricao: 'Articulação de parcerias e relações institucionais',
    corBg: 'bg-[#6b6e77]',
    corIcone: 'text-white',
    logoTexto: 'NURI'
  },
  {
    id: '3',
    nome: 'Núcleo de Internacionalização',
    sigla: 'NINTER',
    descricao: 'Conexões e oportunidades de cooperação internacional',
    corBg: 'bg-[#d99738]',
    corIcone: 'text-white',
    logoTexto: 'NINTER'
  },
  {
    id: '4',
    nome: 'Núcleo do Instituto IPÊ',
    sigla: 'IPÊ',
    descricao: 'Gestão e acompanhamento das iniciativas do IPÊ',
    corBg: 'bg-[#fcf2f7]',
    corIcone: 'text-[#832b62]',
    iconeEmoji: '🌸'
  }
];

export default function Nucleos() {
  const [nucleos, setNucleos] = useState<Nucleo[]>(dadosIniciais);
  const [termoPesquisa, setTermoPesquisa] = useState('');

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalDeletarAberto, setModalDeletarAberto] = useState(false);

  // Estado dos formulários
  const [nucleoSelecionado, setNucleoSelecionado] = useState<Nucleo | null>(null);
  const [nomeForm, setNomeForm] = useState('');
  const [siglaForm, setSiglaForm] = useState('');
  const [descricaoForm, setDescricaoForm] = useState('');

  // Filtrar núcleos
  const nucleosFiltrados = nucleos.filter(n => 
    n.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    n.sigla.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    n.descricao.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  // Ações
  const abrirCriarModal = () => {
    setNomeForm('');
    setSiglaForm('');
    setDescricaoForm('');
    setModalNovoAberto(true);
  };

  const handleCriarNucleo = (e: React.FormEvent) => {
    e.preventDefault();
    const novo: Nucleo = {
      id: Date.now().toString(),
      nome: nomeForm || 'Novo Núcleo',
      sigla: siglaForm || 'SIGLA',
      descricao: descricaoForm || 'Sem descrição cadastrada.',
      corBg: 'bg-[#832b62]',
      corIcone: 'text-white',
      logoTexto: siglaForm || 'NOVO'
    };
    setNucleos([...nucleos, novo]);
    setModalNovoAberto(false);
  };

  const abrirEditarModal = (nucleo: Nucleo) => {
    setNucleoSelecionado(nucleo);
    setNomeForm(nucleo.nome);
    setSiglaForm(nucleo.sigla);
    setDescricaoForm(nucleo.descricao);
    setModalEditarAberto(true);
  };

  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nucleoSelecionado) return;
    setNucleos(nucleos.map(n => n.id === nucleoSelecionado.id ? {
      ...n,
      nome: nomeForm,
      sigla: siglaForm,
      descricao: descricaoForm,
      logoTexto: siglaForm
    } : n));
    setModalEditarAberto(false);
  };

  const abrirDeletarModal = (nucleo: Nucleo) => {
    setNucleoSelecionado(nucleo);
    setModalDeletarAberto(true);
  };

  const handleDeletarNucleo = () => {
    if (!nucleoSelecionado) return;
    setNucleos(nucleos.filter(n => n.id !== nucleoSelecionado.id));
    setModalDeletarAberto(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#3a182d] text-white flex flex-col justify-between p-6 hidden md:flex">
        <div>
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 rounded-full bg-[#fce8f3]/20 flex items-center justify-center text-xl">
              🌸
            </div>
            <span className="font-bold text-xl tracking-wide">IPÊ</span>
          </div>

          <nav className="space-y-2">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>
            <Link to="/nucleos" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white font-medium transition-colors">
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

        <div className="text-xs text-white/50 px-2">
          Instituto IPÊ • UFRPE
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* Cabeçalho */}
        <header className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-serif">Núcleos</h1>
            <p className="text-xs text-slate-400 mt-1">
              Áreas de atuação responsáveis pelo envio periódico dos dados
            </p>
          </div>

          <div className="flex items-center gap-3">
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
        </header>

        {/* Barra de Pesquisa + Botão Novo Núcleo */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-96">
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:border-[#832b62] text-sm text-slate-700 placeholder:text-slate-400 bg-white"
            />
            <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button 
            onClick={abrirCriarModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#702052] hover:bg-[#5a1942] text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Plus size={18} />
            <span>Novo núcleo</span>
          </button>
        </div>

        {/* Lista de Núcleos (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {nucleosFiltrados.map((nucleo) => (
            <div 
              key={nucleo.id} 
              className="bg-[#f2eff4] rounded-2xl p-6 relative flex items-center gap-5 border border-slate-200/60 shadow-xs hover:shadow-md transition-shadow"
            >
              {/* Ícone de Ações no Canto Superior Direito */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 items-center">
                <button 
                  onClick={() => abrirEditarModal(nucleo)}
                  className="p-1 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" 
                  title="Editar"
                >
                  <MoreVertical size={18} />
                </button>
                <button 
                  onClick={() => abrirDeletarModal(nucleo)}
                  className="p-1 text-slate-600 hover:text-red-600 transition-colors cursor-pointer" 
                  title="Deletar"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Avatar do Núcleo */}
              <div className={`w-24 h-24 rounded-full ${nucleo.corBg} ${nucleo.corIcone} flex flex-col items-center justify-center shrink-0 border-2 border-white shadow-inner`}>
                {nucleo.iconeEmoji ? (
                  <span className="text-3xl">{nucleo.iconeEmoji}</span>
                ) : (
                  <span className="font-bold text-lg tracking-wider">{nucleo.logoTexto}</span>
                )}
              </div>

              {/* Detalhes do Núcleo */}
              <div className="pr-6">
                <h3 className="font-bold text-slate-800 text-lg">{nucleo.nome}</h3>
                <span className="text-xs font-semibold text-[#832b62] block mb-1">{nucleo.sigla}</span>
                <p className="text-xs text-slate-500 leading-relaxed">{nucleo.descricao}</p>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* --- MODAL 1: NOVO NÚCLEO --- */}
      {modalNovoAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Novo Núcleo</h2>
            
            <form onSubmit={handleCriarNucleo} className="space-y-4">
              <div className="flex gap-4">
                {/* Upload Foto / Placeholder */}
                <div className="w-24 h-24 rounded-2xl bg-slate-200 flex items-center justify-center relative shrink-0">
                  <Camera size={28} className="text-slate-400" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#4a1836] text-white flex items-center justify-center cursor-pointer shadow-md">
                    <Plus size={16} />
                  </div>
                </div>

                {/* Campos Nome e Sigla */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome</label>
                    <input 
                      type="text" 
                      placeholder="Insira um nome..." 
                      value={nomeForm}
                      onChange={(e) => setNomeForm(e.target.value)}
                      className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sigla</label>
                    <input 
                      type="text" 
                      placeholder="Insira uma sigla..." 
                      value={siglaForm}
                      onChange={(e) => setSiglaForm(e.target.value)}
                      className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea 
                  rows={3} 
                  placeholder="Quais são as principais funções desse Núcleo..." 
                  value={descricaoForm}
                  onChange={(e) => setDescricaoForm(e.target.value)}
                  className="w-full bg-slate-200/70 border-0 rounded-2xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none resize-none"
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setModalNovoAberto(false)}
                  className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus size={14} />
                  <span>Criar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ATUALIZAR NÚCLEO --- */}
      {modalEditarAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Atualizando Núcleo</h2>
            
            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-2xl bg-slate-200 flex items-center justify-center relative shrink-0">
                  <Camera size={28} className="text-slate-400" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#4a1836] text-white flex items-center justify-center cursor-pointer shadow-md">
                    <Plus size={16} />
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome</label>
                    <input 
                      type="text" 
                      value={nomeForm}
                      onChange={(e) => setNomeForm(e.target.value)}
                      className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sigla</label>
                    <input 
                      type="text" 
                      value={siglaForm}
                      onChange={(e) => setSiglaForm(e.target.value)}
                      className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea 
                  rows={3} 
                  value={descricaoForm}
                  onChange={(e) => setDescricaoForm(e.target.value)}
                  className="w-full bg-slate-200/70 border-0 rounded-2xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setModalEditarAberto(false)}
                  className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ATENÇÃO / CONFIRMAÇÃO DE DELETAR --- */}
      {modalDeletarAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Atenção!</h2>
            <p className="text-sm text-slate-600 mb-1">
              Tem certeza que deseja <span className="font-bold text-slate-800">deletar</span> esse Núcleo permanentemente?
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Esta ação <span className="font-bold text-slate-800">não pode ser desfeita</span>.
            </p>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleDeletarNucleo}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition-colors cursor-pointer"
              >
                Deletar
              </button>
              <button 
                onClick={() => setModalDeletarAberto(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}