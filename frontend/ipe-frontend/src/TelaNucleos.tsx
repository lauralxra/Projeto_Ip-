import React, { useEffect, useRef, useState } from 'react';
import { NavBar } from './NavBar';
import { User } from './UserBar';
import { BtnCriar } from './BtnCriar';

import type { Nucleo } from './dados/nucleos';

import { Imagens, Svg } from './config/assets';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { UsuarioAtual } from './dados/usuarios';
import { apiFetch, mensagemDeErro } from './api/cliente';
import { nucleoDaApi, type NucleoApi } from './api/mapeadores';
import { definirNucleosDoUsuario } from './api/usuarioAtual';

function MenuAcoesNucleo({
  ehAtivo,
  onEditar,
  onDesativar,
  onReativar,
  onExcluir,
}: {
  ehAtivo: boolean;
  onEditar: () => void;
  onDesativar: () => void;
  onReativar: () => void;
  onExcluir: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    if (aberto) {
      document.addEventListener('mousedown', handleClickFora);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, [aberto]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="p-1 text-[#3c3b3b] hover:text-[#832b62] hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
        title="Opções do núcleo"
        aria-label="Opções do núcleo"
      >
        <MoreVertical size={18} />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              onEditar();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-[#fcf2f7] hover:text-[#832b62] transition-colors cursor-pointer text-left"
          >
            <Pencil size={14} className="text-slate-600" />
            <span>Editar Núcleo</span>
          </button>

          {ehAtivo ? (
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                onDesativar();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer text-left"
            >
              <Archive size={14} className="text-amber-600" />
              <span>Desativar / Arquivar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                onReativar();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer text-left"
            >
              <RotateCcw size={14} className="text-emerald-600" />
              <span>Reativar Núcleo</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => {
              setAberto(false);
              onExcluir();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
          >
            <Trash2 size={14} className="text-rose-600" />
            <span>Excluir Núcleo</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function TelaNucleos() {
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<
    'TODOS' | 'ATIVO' | 'INATIVO'
  >('TODOS');
  const [mensagemFeedback, setMensagemFeedback] = useState<string | null>(null);

  const exibirFeedback = (texto: string) => {
    setMensagemFeedback(texto);
  };

  // GET /nucleos já respeita o perfil (ADM/EC veem todos; DN/EG, os vinculados)
  const carregarNucleos = async () => {
    try {
      const { itens } = await apiFetch<{ itens: NucleoApi[] }>(
        '/nucleos?limite=100',
      );
      setNucleos(itens.map(nucleoDaApi));
      // Mantém na sessão global apenas núcleos ATIVOS para seletores de novos cadastros (RN02)
      definirNucleosDoUsuario(
        itens.filter((n) => (n.status ?? 'ATIVO') === 'ATIVO'),
      );
    } catch (erro) {
      console.error('Erro ao carregar núcleos:', erro);
      alert('Não foi possível carregar os núcleos: ' + mensagemDeErro(erro));
    }
  };

  useEffect(() => {
    carregarNucleos();
  }, []);

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  // Estado dos formulários
  const [nucleoSelecionado, setNucleoSelecionado] = useState<Nucleo | null>(
    null,
  );
  const [nomeForm, setNomeForm] = useState('');
  const [siglaForm, setSiglaForm] = useState('');
  const [descricaoForm, setDescricaoForm] = useState('');
  const [statusForm, setStatusForm] = useState<'ATIVO' | 'INATIVO'>('ATIVO');

  const [imagemPreview, setImagemPreview] = useState<string | null>();
  // Arquivo escolhido no formulário, enviado para PATCH /nucleos/:id/imagem
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);

  const enviarImagem = async (nucleoId: string, arquivo: File) => {
    const formulario = new FormData();
    formulario.append('imagem', arquivo);
    await apiFetch(`/nucleos/${nucleoId}/imagem`, {
      method: 'PATCH',
      body: formulario,
    });
  };

  // Filtrar núcleos por busca e status
  const nucleosFiltrados = nucleos.filter((n) => {
    const statusAtual = n.status ?? 'ATIVO';
    const matchStatus =
      filtroStatus === 'TODOS'
        ? true
        : filtroStatus === 'ATIVO'
          ? statusAtual === 'ATIVO'
          : statusAtual !== 'ATIVO';

    const termo = termoPesquisa.toLowerCase();
    const matchBusca =
      n.nome.toLowerCase().includes(termo) ||
      n.sigla.toLowerCase().includes(termo) ||
      n.descricao.toLowerCase().includes(termo);

    return matchStatus && matchBusca;
  });

  // Ações
  const abrirCriarModal = () => {
    setNomeForm('');
    setSiglaForm('');
    setDescricaoForm('');
    setImagemPreview('');
    setArquivoImagem(null);
    setModalNovoAberto(true);
  };

  const handleCriarNucleo = async (e: React.FormEvent) => {
    e.preventDefault();
    let criado: { id: string };
    try {
      criado = await apiFetch<{ id: string }>('/nucleos', {
        method: 'POST',
        body: JSON.stringify({
          nome: nomeForm.trim(),
          sigla: siglaForm.trim(),
          descricao: descricaoForm.trim() || undefined,
        }),
      });
    } catch (erro) {
      alert('Não foi possível criar o núcleo: ' + mensagemDeErro(erro));
      return;
    }

    setModalNovoAberto(false);
    if (arquivoImagem) {
      try {
        await enviarImagem(criado.id, arquivoImagem);
      } catch (erro) {
        alert(
          'O núcleo foi criado, mas a imagem não foi salva: ' +
            mensagemDeErro(erro),
        );
      }
    }
    await carregarNucleos();
  };

  const abrirEditarModal = (nucleo: Nucleo) => {
    setNucleoSelecionado(nucleo);
    setNomeForm(nucleo.nome);
    setSiglaForm(nucleo.sigla);
    setDescricaoForm(nucleo.descricao);
    setStatusForm((nucleo.status ?? 'ATIVO') === 'ATIVO' ? 'ATIVO' : 'INATIVO');
    setImagemPreview(nucleo.icone || '');
    setArquivoImagem(null);
    setModalEditarAberto(true);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nucleoSelecionado) return;

    // Nome, sigla, descrição e status (PATCH /nucleos/:id): envia só o que mudou
    const statusAtual =
      (nucleoSelecionado.status ?? 'ATIVO') === 'ATIVO' ? 'ATIVO' : 'INATIVO';
    const alteracoes: Record<string, string> = {};
    if (nomeForm.trim() !== nucleoSelecionado.nome)
      alteracoes.nome = nomeForm.trim();
    if (siglaForm.trim() !== nucleoSelecionado.sigla)
      alteracoes.sigla = siglaForm.trim();
    if (descricaoForm.trim() !== nucleoSelecionado.descricao)
      alteracoes.descricao = descricaoForm.trim();
    if (statusForm !== statusAtual) alteracoes.status = statusForm;

    try {
      if (Object.keys(alteracoes).length > 0) {
        await apiFetch(`/nucleos/${nucleoSelecionado.id}`, {
          method: 'PATCH',
          body: JSON.stringify(alteracoes),
        });
      }
      // A imagem tem endpoint próprio
      if (arquivoImagem) {
        await enviarImagem(nucleoSelecionado.id, arquivoImagem);
      }
      setModalEditarAberto(false);
      if (statusForm === 'ATIVO' && statusAtual !== 'ATIVO') {
        exibirFeedback('Núcleo reativado com sucesso.');
      } else if (statusForm !== 'ATIVO' && statusAtual === 'ATIVO') {
        exibirFeedback('Núcleo desativado com sucesso.');
      }
    } catch (erro) {
      // Ex.: 409 quando nome ou sigla já pertencem a outro núcleo
      alert('Não foi possível salvar o núcleo: ' + mensagemDeErro(erro));
    } finally {
      await carregarNucleos();
    }
  };

  // UC026: Desativar / Arquivar Núcleo (Modal padrão + Alerta secundário para indicadores pendentes)
  const [modalDesativarAberto, setModalDesativarAberto] = useState(false);
  const [modalPendenciasAberto, setModalPendenciasAberto] = useState(false);
  const [pendenciasInfo, setPendenciasInfo] = useState<{
    totalIndicadoresPendentes: number;
    totalRegistrosPendentes: number;
  }>({ totalIndicadoresPendentes: 0, totalRegistrosPendentes: 0 });
  const [processandoStatus, setProcessandoStatus] = useState(false);

  const abrirDesativarModal = (nucleo: Nucleo) => {
    setNucleoSelecionado(nucleo);
    setModalDesativarAberto(true);
  };

  const concluirDesativacao = async (nucleo: Nucleo) => {
    await apiFetch(`/nucleos/${nucleo.id}/desativar`, { method: 'PATCH' });
    setModalDesativarAberto(false);
    setModalPendenciasAberto(false);
    await carregarNucleos();
    exibirFeedback('Núcleo desativado com sucesso.');
  };

  const handleConfirmarDesativacao = async () => {
    if (!nucleoSelecionado || processandoStatus) return;

    setProcessandoStatus(true);
    try {
      // RN04 / FE-026.01: checa se há indicadores em preenchimento ou enviados para revisão
      const pendencias = await apiFetch<{
        possuiPendencias: boolean;
        totalIndicadoresPendentes: number;
        totalRegistrosPendentes: number;
      }>(`/nucleos/${nucleoSelecionado.id}/pendencias`);

      if (pendencias.possuiPendencias) {
        setPendenciasInfo({
          totalIndicadoresPendentes: pendencias.totalIndicadoresPendentes,
          totalRegistrosPendentes: pendencias.totalRegistrosPendentes,
        });
        setModalDesativarAberto(false);
        setModalPendenciasAberto(true);
        return;
      }

      await concluirDesativacao(nucleoSelecionado);
    } catch (erro) {
      alert('Não foi possível desativar o núcleo: ' + mensagemDeErro(erro));
    } finally {
      setProcessandoStatus(false);
    }
  };

  const handleConfirmarComPendencias = async () => {
    if (!nucleoSelecionado || processandoStatus) return;

    setProcessandoStatus(true);
    try {
      await concluirDesativacao(nucleoSelecionado);
    } catch (erro) {
      alert('Não foi possível desativar o núcleo: ' + mensagemDeErro(erro));
    } finally {
      setProcessandoStatus(false);
    }
  };

  // RN03: reativação rápida pela listagem
  const handleReativarNucleo = async (nucleo: Nucleo) => {
    try {
      await apiFetch(`/nucleos/${nucleo.id}/reativar`, { method: 'PATCH' });
      await carregarNucleos();
      exibirFeedback('Núcleo reativado com sucesso.');
    } catch (erro) {
      alert('Não foi possível reativar o núcleo: ' + mensagemDeErro(erro));
    }
  };

  // Deletamento Handling
  const [modalDeletarAberto, setModalDeletarAberto] = useState(false);
  const abrirDeletarModal = (nucleo: Nucleo) => {
    setNucleoSelecionado(nucleo);
    setModalDeletarAberto(true);
  };

  const handleDeletarNucleo = async () => {
    if (!nucleoSelecionado) return;
    try {
      await apiFetch(`/nucleos/${nucleoSelecionado.id}`, { method: 'DELETE' });
      setModalDeletarAberto(false);
      await carregarNucleos();
    } catch (erro) {
      // Ex.: 409 quando o núcleo tem usuários, programas ou indicadores vinculados
      alert('Não foi possível excluir o núcleo: ' + mensagemDeErro(erro));
    }
  };

  const handleMudarImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      setArquivoImagem(arquivo);
      const urlTemporaria = URL.createObjectURL(arquivo);
      setImagemPreview(urlTemporaria);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] overflow-hidden">
      {/* Sidebar */}
      <NavBar />

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 w-full h-full overflow-y-auto">
        {/* Cabeçalho */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl font-sans font-normal relative shrink-0 text-[#a13680] w-full">
              Núcleos
            </h1>
            <p className="font-sans font-light relative shrink-0 text-[#8e8e93] w-full text-sm text-slate-500 mt-1">
              Áreas de atuação responsáveis pelo envio periódico dos dados
            </p>
          </div>
        </header>

        {/* Feedback de ação (toast/banner no padrão IPÊ) */}
        {mensagemFeedback && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-[#d5e4d1] px-5 py-3.5 text-sm font-medium text-[#24421e] shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{mensagemFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setMensagemFeedback(null)}
              className="text-xs font-bold text-[#24421e]/70 hover:text-[#24421e] cursor-pointer px-1"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
        )}

        {/* Barra de Pesquisa + Filtro Status + Botão Novo Núcleo */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 flex-wrap">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-80 md:w-96">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:border-[#832b62] text-sm text-slate-700 placeholder:text-slate-400 bg-white"
              />
              <Search
                size={18}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Filtro de Status seguindo a geometria oficial do CustomDropdown */}
            <div className="bg-transparent border-2 border-[#3b142f] flex h-[48px] items-center justify-between px-[16px] rounded-[9px] shrink-0 w-full sm:w-[210px] relative cursor-pointer">
              <div className="size-[20px] relative shrink-0 pointer-events-none text-[#3b142f]">
                <Archive className="size-full" />
              </div>

              <select
                aria-label="Filtrar núcleos por status"
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(
                    e.target.value as 'TODOS' | 'ATIVO' | 'INATIVO',
                  )
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              >
                <option value="TODOS">Todos os status</option>
                <option value="ATIVO">Ativos</option>
                <option value="INATIVO">Inativos/Arquivados</option>
              </select>

              <p className="font-normal text-[#3d3d3d] text-[15px] whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none flex-1 ml-2">
                {filtroStatus === 'TODOS'
                  ? 'Todos os status'
                  : filtroStatus === 'ATIVO'
                    ? 'Ativos'
                    : 'Inativos/Arquivados'}
              </p>

              <div className="h-[8px] w-[12px] pointer-events-none shrink-0">
                <svg
                  className="block size-full"
                  fill="none"
                  viewBox="0 0 16.2247 10.0188"
                >
                  <path d={Svg.SetaBaixo} fill="#191919" />
                </svg>
              </div>
            </div>
          </div>

          {UsuarioAtual.tipo == 'ADM' ? (
            <BtnCriar txt="Novo núcleo" acao={abrirCriarModal} />
          ) : (
            ''
          )}
        </div>

        {/* Lista de Núcleos (Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {nucleosFiltrados.map((nucleo) => {
            const ehAtivo = (nucleo.status ?? 'ATIVO') === 'ATIVO';

            return (
              <div
                key={nucleo.id}
                className={`rounded-2xl p-4 sm:p-6 relative flex items-start sm:items-center gap-4 sm:gap-5 border shadow-xs hover:shadow-md transition-shadow ${
                  ehAtivo
                    ? 'bg-[#f2eff4] border-slate-200/60'
                    : 'bg-[#f2eff4]/75 border-[#832b62]/20'
                }`}
              >
                {/* Menu de Ações no Canto Superior Direito (RN01: apenas Administradora) */}
                {UsuarioAtual.tipo == 'ADM' ? (
                  <div className="absolute top-3.5 right-3.5 z-10">
                    <MenuAcoesNucleo
                      ehAtivo={ehAtivo}
                      onEditar={() => abrirEditarModal(nucleo)}
                      onDesativar={() => abrirDesativarModal(nucleo)}
                      onReativar={() => handleReativarNucleo(nucleo)}
                      onExcluir={() => abrirDeletarModal(nucleo)}
                    />
                  </div>
                ) : (
                  ''
                )}

                {/* Avatar do Núcleo */}
                <div
                  className={`size-20 sm:size-24 rounded-full ${nucleo.corBg} ${nucleo.corIcone} flex flex-col items-center justify-center shrink-0 border-2 border-white shadow-inner overflow-hidden ${
                    ehAtivo ? '' : 'opacity-70'
                  }`}
                >
                  {nucleo.icone ? (
                    <img
                      alt={nucleo.nome}
                      className="size-full object-cover rounded-full"
                      src={nucleo.icone}
                    />
                  ) : (
                    <span className="font-bold tracking-wider text-xs sm:text-sm">
                      {nucleo.logoTexto}
                    </span>
                  )}
                </div>

                {/* Detalhes do Núcleo */}
                <div className="pr-8 sm:pr-10 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-bold text-slate-800 text-base sm:text-lg break-words leading-tight">
                      {nucleo.nome}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                        ehAtivo
                          ? 'bg-[#d5e4d1] text-[#24421e]'
                          : 'bg-[#ffdfbf] text-[#5c3310]'
                      }`}
                    >
                      {ehAtivo ? 'Ativo' : 'Inativo/Arquivado'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#832b62] block mb-1">
                    {nucleo.sigla}
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed break-words line-clamp-3">
                    {nucleo.descricao}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ==================== BARRA DO USUÁRIO ========================== */}
      <div
        className="hidden md:block absolute h-[60px] right-0 top-0 w-auto z-20"
        data-name="userbar"
      >
        <div className="flex flex-row justify-end max-w-[inherit] min-w-[inherit] size-full">
          <div className="content-stretch flex items-start justify-end max-w-[inherit] min-w-[inherit] relative size-full">
            <User />
          </div>
        </div>
      </div>

      {/* ==================== TELAS POPUP ======================== */}
      {/* --- MODAL 1: NOVO NÚCLEO --- */}
      {modalNovoAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Novo Núcleo
            </h2>

            <form onSubmit={handleCriarNucleo} className="space-y-4">
              <div className="flex gap-4">
                {/* Upload Foto / Placeholder */}
                <div className="w-24 h-24 rounded-2xl bg-slate-200 flex items-center justify-center relative shrink-0">
                  <img
                    alt=""
                    className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full"
                    src={imagemPreview || Imagens.DefaultPFP}
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#4a1836] text-white flex items-center justify-center cursor-pointer shadow-md">
                    <Plus size={16} />
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMudarImagem}
                    className="absolute inset-0 opacity-0 cursor-pointer size-full z-10"
                    title="Alterar foto"
                  />
                </div>

                {/* Campos Nome e Sigla */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      placeholder="Insira um nome..."
                      required
                      value={nomeForm}
                      onChange={(e) => setNomeForm(e.target.value)}
                      className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sigla
                    </label>
                    <input
                      type="text"
                      placeholder="Insira uma sigla..."
                      required
                      value={siglaForm}
                      onChange={(e) => setSiglaForm(e.target.value)}
                      className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição
                </label>
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
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Atualizando Núcleo
            </h2>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-2xl bg-slate-200 flex items-center justify-center relative shrink-0">
                  <img
                    alt=""
                    className="absolute inset-0 max-w-none object-cover rounded-[5px] size-full"
                    src={imagemPreview || Imagens.DefaultPFP}
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#4a1836] text-white flex items-center justify-center cursor-pointer shadow-md">
                    <Plus size={16} />
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMudarImagem}
                    className="absolute inset-0 opacity-0 cursor-pointer size-full z-10"
                    title="Alterar foto"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={nomeForm}
                      onChange={(e) => setNomeForm(e.target.value)}
                      className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sigla
                    </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={descricaoForm}
                  onChange={(e) => setDescricaoForm(e.target.value)}
                  className="w-full bg-slate-200/70 border-0 rounded-2xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none resize-none"
                />
              </div>

              {/* RN03: permite reativar um núcleo desativado/arquivado pela tela de edição */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={statusForm}
                  onChange={(e) =>
                    setStatusForm(e.target.value as 'ATIVO' | 'INATIVO')
                  }
                  className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#832b62] focus:outline-none cursor-pointer"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo/Arquivado</option>
                </select>
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

      {/* --- MODAL UC026 (1): CONFIRMAÇÃO DE DESATIVAÇÃO / ARQUIVAMENTO --- */}
      {modalDesativarAberto && nucleoSelecionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-11 rounded-full bg-[#fbd3ee]/70 text-[#832b62] flex items-center justify-center shrink-0">
                <Archive className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Desativar/Arquivar Núcleo
                </h2>
                <p className="text-xs text-slate-500">
                  Confirmação de encerramento do ciclo ativo
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Tem certeza que deseja desativar/arquivar o núcleo{' '}
              <span className="font-bold text-slate-900">
                "{nucleoSelecionado.nome}"
              </span>
              ?
            </p>

            <div className="bg-[#f2eff4] border border-[#832b62]/20 rounded-2xl p-4 text-xs text-[#3b142f] space-y-1.5 mb-6">
              <p>
                • <strong>Histórico preservado:</strong> indicadores, metas e
                dados passados continuam acessíveis para consulta e relatórios.
              </p>
              <p>
                • <strong>Fora do ciclo ativo:</strong> o núcleo não poderá mais
                ser selecionado em novos programas, indicadores ou
                preenchimentos.
              </p>
              <p>
                • <strong>Ação reversível:</strong> você poderá reativar o
                núcleo depois pela tela de edição.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={processandoStatus}
                onClick={() => setModalDesativarAberto(false)}
                className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processandoStatus}
                onClick={handleConfirmarDesativacao}
                className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer disabled:opacity-50"
              >
                {processandoStatus ? 'Verificando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL UC026 (2): ALERTA SECUNDÁRIO DE INDICADORES PENDENTES (FE-026.01) --- */}
      {modalPendenciasAberto && nucleoSelecionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-11 rounded-full bg-[#ffdfbf] text-[#5c3310] flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Indicadores Pendentes
                </h2>
                <p className="text-xs text-slate-500">
                  {pendenciasInfo.totalIndicadoresPendentes}{' '}
                  {pendenciasInfo.totalIndicadoresPendentes === 1
                    ? 'indicador com pendência'
                    : 'indicadores com pendências'}{' '}
                  em {nucleoSelecionado.sigla}
                </p>
              </div>
            </div>

            <div className="bg-[#f2eff4] border border-[#832b62]/20 rounded-2xl p-4 text-sm text-[#3b142f] leading-relaxed mb-6">
              Este núcleo possui indicadores pendentes de revisão. Ao
              desativá-lo, o preenchimento desses indicadores será interrompido.
              Deseja continuar?
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={processandoStatus}
                onClick={() => setModalPendenciasAberto(false)}
                className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processandoStatus}
                onClick={handleConfirmarComPendencias}
                className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer disabled:opacity-50"
              >
                {processandoStatus ? 'Desativando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ATENÇÃO / CONFIRMAÇÃO DE DELETAR --- */}
      {modalDeletarAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Atenção!</h2>
            <p className="text-sm text-slate-600 mb-1">
              Tem certeza que deseja{' '}
              <span className="font-bold text-slate-800">deletar</span> esse
              Núcleo permanentemente?
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Esta ação{' '}
              <span className="font-bold text-slate-800">
                não pode ser desfeita
              </span>
              .
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalDeletarAberto(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletarNucleo}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition-colors cursor-pointer"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
