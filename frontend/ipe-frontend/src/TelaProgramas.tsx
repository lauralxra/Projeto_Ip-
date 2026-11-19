import { useEffect, useState } from 'react';
import { MoreVertical, Search, Trash2 } from 'lucide-react';
import { Svg } from './config/assets';
import { type Programa } from './dados/programas';
import { apiFetch, mensagemDeErro } from './api/cliente';
import {
  nucleoDaApi,
  usuarioDaApi,
  type NucleoApi,
  type UsuarioApi,
} from './api/mapeadores';
import { NavBar } from './NavBar';
import { User } from './UserBar';
import { CustomDropdown } from './CustomDropdown';
import { NucleosCadastrados, type Nucleo } from './dados/nucleos';
import { BtnCriar } from './BtnCriar';
import {
  UsuarioAtual,
  UsuariosCadastrados,
  type Usuario,
} from './dados/usuarios';
import 'react-datepicker/dist/react-datepicker.css';

interface ProgramaApi {
  id: string;
  nome: string;
  descricao?: string | null;
  createdAt: string;
  nucleo?: NucleoApi | null;
  responsavelId?: string | null;
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  } | null;
}

// Programas sem núcleo são institucionais: o card usa a identidade do IPÊ
const NUCLEO_INSTITUCIONAL: Nucleo =
  NucleosCadastrados.find((n) => n.sigla === 'IPÊ') ?? NucleosCadastrados[0];

function ProgramaObj({
  programaEmSi,
  editFunc,
  delFunc,
}: {
  programaEmSi: Programa;
  editFunc: (obj: Programa) => void;
  delFunc: (obj: Programa) => void;
}) {
  const nucleo = programaEmSi.nucleo ?? NUCLEO_INSTITUCIONAL;

  return (
    <div
      className="bg-white border-2 border-[#3b142f] border-solid content-stretch flex gap-[16px] items-start min-h-[120px] px-[18px] py-[14px] relative rounded-[12px] shadow-xs hover:shadow-md transition-shadow shrink-0 w-full"
      data-name="Programa"
    >
      {/* Logo do Programa */}
      <div
        className={`h-[75px] w-[75px] relative ${nucleo.corBg} ${nucleo.corIcone} flex items-center justify-center rounded-full overflow-clip shrink-0 border border-slate-200`}
        data-name="Img"
      >
        {nucleo.icone ? (
          <div>
            <img
              alt=""
              className="absolute inset-0 object-cover pointer-events-none size-full"
              src={nucleo.icone}
            />
          </div>
        ) : (
          <span className="font-bold text-[12px] tracking-wider">
            {nucleo.logoTexto}
          </span>
        )}
      </div>

      <div className="content-stretch flex flex-1 flex-col gap-[6px] relative pr-6">
        {UsuarioAtual.tipo == 'ADM' ? (
          <>
            {/* edicao */}
            <button
              className="absolute right-0 size-[20px] top-0 cursor-pointer"
              data-name="akar-icons:more-vertical-fill"
              onClick={() => editFunc(programaEmSi)}
            >
              <MoreVertical size={18} />
            </button>

            {/* deletamento */}
            <button
              className="absolute right-0 size-[20px] top-8 cursor-pointer"
              data-name="akar-icons:more-vertical-fill"
              onClick={() => delFunc(programaEmSi)}
            >
              <Trash2 size={16} />
            </button>
          </>
        ) : (
          ''
        )}

        {/* nome */}
        <p className="font-['Google_Sans_Flex:SemiBold',sans-serif] font-semibold text-[#040404] text-[16px] leading-tight">
          {programaEmSi.nome}
        </p>

        {/* sigla */}
        <p className="font-['Google_Sans_Flex:Bold',sans-serif] font-bold text-[#664666] text-[12px]">
          {nucleo.sigla}
        </p>

        {/* desceição */}
        <p className="font-['Google_Sans_Flex:Regular',sans-serif] font-normal text-[#4a4a4a] text-[13px] leading-snug line-clamp-2">
          {programaEmSi.descricao}
        </p>

        <div className="flex gap-[20px] items-center pt-1 text-[12px] text-[#555]">
          {/* data de criação */}
          <div className="flex gap-[6px] items-center">
            <div className="size-[16px] shrink-0">
              <svg
                className="block size-full"
                fill="none"
                viewBox="0 0 32.4495 32.4495"
              >
                <path
                  d={Svg.pe78f480}
                  stroke="#0632E3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path
                  d={Svg.p133ca7f0}
                  stroke="#0632E3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <span>
              Início:{' '}
              {new Date(programaEmSi.dataDeInicio).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* participantes */}
          <div className="flex gap-[6px] items-center">
            <div className="size-[18px] shrink-0">
              <svg className="block size-full" fill="none" viewBox="0 0 39 39">
                <path d={Svg.p444d880} fill="#08831A" />
              </svg>
            </div>
            <span>{programaEmSi.participantes.length} Participantes</span>
          </div>

          {/* responsável */}
          {programaEmSi.responsavel && (
            <div className="flex gap-[6px] items-center text-slate-700">
              <span className="font-semibold text-slate-700">
                Resp:{' '}
                <span className="font-normal text-slate-600">
                  {programaEmSi.responsavel.nome}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TelaProgramas() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<Usuario[]>([]);

  useEffect(() => {
    const carregarProgramas = async () => {
      try {
        const dados = await apiFetch<ProgramaApi[]>('/programas');
        setProgramas(
          dados.map((item) => ({
            id: item.id,
            nome: item.nome,
            descricao: item.descricao ?? '',
            nucleo: item.nucleo ? nucleoDaApi(item.nucleo) : undefined,
            // A API não tem data de início: usa a data de cadastro
            dataDeInicio: new Date(item.createdAt),
            // GET /programas só devolve programas ativos
            status: 'Ativo',
            responsavel: item.responsavel
              ? {
                  id: item.responsavel.id,
                  nome: item.responsavel.nome,
                  email: item.responsavel.email,
                  senha: '',
                  tipo: 'EC',
                  nucleos: [],
                  status: 1,
                }
              : undefined,
            participantes: [],
          })),
        );
      } catch (erro) {
        console.error('Erro ao carregar programas:', erro);
        alert(
          'Não foi possível carregar os programas: ' + mensagemDeErro(erro),
        );
      }
    };

    const carregarUsuarios = async () => {
      if (UsuarioAtual.tipo !== 'ADM') return;
      try {
        const dados = await apiFetch<UsuarioApi[]>('/users');
        setUsuariosDisponiveis(dados.map(usuarioDaApi));
      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
      }
    };

    carregarProgramas();
    carregarUsuarios();
  }, []);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [programaSelecionado, setProgramaSelecionado] = useState<Programa>();

  const [filtroNucleo, setFiltroNucleo] = useState('');
  const NucleosDoUser = Array.from(new Set(UsuarioAtual.nucleos));
  const listaNucleosNome = Array.from(
    new Set(NucleosDoUser.map((i) => i.sigla)),
  );

  const programsDoUser = programas.filter((n) => {
    if (UsuarioAtual.tipo === 'ADM') return true;
    if (!n.nucleo) return false;

    // Verifica se algum dos núcleos do usuário possui a mesma sigla ou ID do núcleo do indicador
    return UsuarioAtual.nucleos?.some(
      (nuUser) => nuUser.sigla === n.nucleo?.sigla,
    );
  });

  const programPorNome = programsDoUser.filter(
    (n) =>
      n.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
      n.descricao.toLowerCase().includes(termoPesquisa.toLowerCase()),
  );

  const programsFiltrados = programPorNome.filter((n) => {
    // Se filtroNucleo for vazio, aceita todos. Se for "Nenhum", filtra os que não têm núcleo. Senão filtra pelo nome.
    const matchNucleo =
      filtroNucleo === ''
        ? true
        : filtroNucleo === 'Nenhum'
          ? !n.nucleo
          : n.nucleo?.sigla === filtroNucleo;
    return matchNucleo;
  });

  const [modalCriacao, setModalCriacao] = useState(false);
  const abrirCriarModal = () => {
    setModalCriacao(true);
  };

  const [modalEdicao, setModalEdicao] = useState(false);
  const abrirEdicaoModal = (program: Programa) => {
    setProgramaSelecionado(program);
    setModalEdicao(true);
  };

  const handleSalvarPrograma = async (dadosProgram: Programa) => {
    const existe = programas.some((u) => u.id === dadosProgram.id);

    try {
      if (existe) {
        const atualizado = await apiFetch<ProgramaApi>(
          `/programas/${dadosProgram.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              nome: dadosProgram.nome,
              descricao: dadosProgram.descricao || undefined,
              nucleoId: dadosProgram.nucleo?.id || null,
              responsavelId: dadosProgram.responsavel?.id || null,
            }),
          },
        );

        setProgramas((prev) =>
          prev.map((u) =>
            u.id === dadosProgram.id
              ? {
                  ...dadosProgram,
                  nome: atualizado.nome,
                  descricao: atualizado.descricao ?? '',
                  nucleo: atualizado.nucleo
                    ? nucleoDaApi(atualizado.nucleo)
                    : undefined,
                  responsavel: atualizado.responsavel
                    ? {
                        id: atualizado.responsavel.id,
                        nome: atualizado.responsavel.nome,
                        email: atualizado.responsavel.email,
                        senha: '',
                        tipo: 'EC',
                        nucleos: [],
                        status: 1,
                      }
                    : undefined,
                }
              : u,
          ),
        );
        setModalEdicao(false);
      } else {
        const criado = await apiFetch<ProgramaApi>('/programas', {
          method: 'POST',
          body: JSON.stringify({
            nome: dadosProgram.nome,
            descricao: dadosProgram.descricao || undefined,
            nucleoId: dadosProgram.nucleo?.id || undefined,
            responsavelId: dadosProgram.responsavel?.id || undefined,
          }),
        });

        const novoPrograma: Programa = {
          id: criado.id,
          nome: criado.nome,
          descricao: criado.descricao ?? '',
          nucleo: criado.nucleo ? nucleoDaApi(criado.nucleo) : undefined,
          responsavel: criado.responsavel
            ? {
                id: criado.responsavel.id,
                nome: criado.responsavel.nome,
                email: criado.responsavel.email,
                senha: '',
                tipo: 'EC',
                nucleos: [],
                status: 1,
              }
            : undefined,
          dataDeInicio: new Date(criado.createdAt),
          status: 'Ativo',
          participantes: [],
        };

        setProgramas((prev) => [...prev, novoPrograma]);
        setModalCriacao(false);
      }
      setProgramaSelecionado(undefined);
    } catch (erro) {
      console.error('Erro ao salvar programa:', erro);
      alert(erro instanceof Error ? erro.message : 'Erro ao salvar programa.');
    }
  };

  // Deletamento handling
  const [modalDeletarAberto, setModalDeletarAberto] = useState(false);
  const abrirDeletarModal = (program: Programa) => {
    setProgramaSelecionado(program);
    setModalDeletarAberto(true);
  };

  const handleDeletarProgram = async () => {
    if (!programaSelecionado) return;
    try {
      await apiFetch(`/programas/${programaSelecionado.id}`, {
        method: 'DELETE',
      });
      setProgramas((prev) =>
        prev.filter((n) => n.id !== programaSelecionado.id),
      );
      setModalDeletarAberto(false);
      setProgramaSelecionado(undefined);
    } catch (erro) {
      console.error('Erro ao excluir programa:', erro);
      alert(erro instanceof Error ? erro.message : 'Erro ao excluir programa.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] overflow-hidden">
      <NavBar />
      {/*================ CONTEÚDO PRINCIPAL =================*/}
      <main className="flex-1 p-4 sm:p-6 md:p-8 w-full h-full overflow-y-auto pt-4 sm:pt-6 md:pt-10">
        <div className="flex flex-1 flex-col gap-5 items-center pt-2 sm:pt-4 pb-20 w-full h-full">
          <div className="flex items-center justify-between px-[10px] w-full shrink-0">
            <p className="text-3xl font-['Google_Sans_Flex:Regular',sans-serif] font-normal relative shrink-0 text-[#a13680] w-full">
              Programas
            </p>
          </div>

          <div className="flex items-center justify-between px-[10px] py-[5px] shrink-0 w-full gap-4">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:border-[#832b62] text-sm text-slate-700 placeholder:text-slate-400 bg-white shadow-xs"
              />
              <Search
                size={18}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Botoes */}
            <div className="flex flex-row items-center gap-[15px]">
              <CustomDropdown
                icon={Svg.UsersMais}
                label="Núcleos"
                valor={filtroNucleo}
                onChange={setFiltroNucleo}
                opcoes={listaNucleosNome}
              />

              {UsuarioAtual.tipo == 'ADM' ? (
                <BtnCriar txt="Criar Programa" acao={abrirCriarModal} />
              ) : (
                ''
              )}
            </div>
          </div>

          {/* Lista de Programas Ajustada */}
          <div
            className="gap-[12px] flex flex-col items-center h-full overflow-y-auto px-[10px] py-[10px] w-full shrink-0"
            data-name="ListaProgramas"
          >
            {programsFiltrados.map((programa) => (
              <ProgramaObj
                key={programa.id}
                programaEmSi={programa}
                editFunc={abrirEdicaoModal}
                delFunc={abrirDeletarModal}
              />
            ))}
          </div>
        </div>
      </main>
      {/* ==================== BARRA DO USUÁRIO ========================== */}
      <div
        className="absolute h-[60px] right-0 top-0 w-auto"
        data-name="userbar"
      >
        <div className="flex flex-row justify-end max-w-[inherit] min-w-[inherit] size-full">
          <div className="content-stretch flex items-start justify-end max-w-[inherit] min-w-[inherit] relative size-full">
            <User />
          </div>
        </div>
      </div>
      {/* ==================== TELAS POPUP ======================== */}
      {/* criação */}
      {modalCriacao && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <EditProgramaPopup
            header="Criando programa"
            id={''}
            nome={''}
            nucleo={undefined}
            descricao={''}
            status={'Ativo'}
            dataDeInicio={new Date()}
            responsavel={undefined}
            participantes={[]}
            usuariosDisponiveis={usuariosDisponiveis}
            onSubmit={handleSalvarPrograma}
            onClose={() => setModalCriacao(false)}
          />
        </div>
      )}
      ;{/* edição */}
      {modalEdicao && programaSelecionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <EditProgramaPopup
            header="Editando programa"
            id={programaSelecionado.id}
            nome={programaSelecionado.nome}
            nucleo={programaSelecionado.nucleo}
            descricao={programaSelecionado.descricao}
            status={programaSelecionado.status}
            dataDeInicio={programaSelecionado.dataDeInicio}
            responsavel={programaSelecionado.responsavel}
            participantes={programaSelecionado.participantes}
            usuariosDisponiveis={usuariosDisponiveis}
            onSubmit={handleSalvarPrograma}
            onClose={() => setModalEdicao(false)}
          />
        </div>
      )}
      {/* deletamento */}
      {modalDeletarAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Atenção!</h2>
            <p className="text-sm text-slate-600 mb-1">
              Tem certeza que deseja{' '}
              <span className="font-bold text-slate-800">deletar</span> esse
              Programa permanentemente?
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
                onClick={handleDeletarProgram}
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

type programItems = {
  header: string;
  id: string;
  nome: string;
  nucleo?: Nucleo;
  descricao: string;
  dataDeInicio: Date;
  status: string;
  responsavel?: Usuario;
  participantes: Usuario[];
  usuariosDisponiveis?: Usuario[];
  onSubmit: (programa: Programa) => void;
  onClose: () => void;
};

function EditProgramaPopup({
  header,
  id,
  nome,
  nucleo,
  descricao,
  dataDeInicio,
  status,
  responsavel,
  participantes,
  usuariosDisponiveis = [],
  onSubmit,
  onClose,
}: programItems) {
  const listaUsuarios =
    usuariosDisponiveis && usuariosDisponiveis.length > 0
      ? usuariosDisponiveis
      : UsuariosCadastrados;
  const [formNome, setFormNome] = useState(nome || '');
  const [formNucleo, setFormNucleo] = useState<Nucleo | undefined>(nucleo);
  const [formDescricao, setFormDescricao] = useState(descricao || '');
  const [formData, setFormData] = useState<Date>(
    dataDeInicio ? new Date(dataDeInicio) : new Date(),
  );
  const [formStatus, setFormStatus] = useState(status || 'Ativo');
  const [formResponsavel, setFormResponsavel] = useState<Usuario | undefined>(
    responsavel,
  );
  const [formParticipantes, setFormParticipantes] = useState<Usuario[]>(
    participantes || [],
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNucleo) {
      alert('Por favor, selecione um núcleo responsável.');
      return;
    }

    if (!formResponsavel) {
      alert('Por favor, selecione um responsável.');
      return;
    }

    onSubmit({
      id:
        id ||
        (typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`),
      nome: formNome,
      nucleo: formNucleo,
      descricao: formDescricao,
      dataDeInicio: formData,
      status: formStatus,
      responsavel: formResponsavel,
      participantes: formParticipantes,
    });
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-white border border-[#a13680] border-solid flex flex-col gap-6 items-center overflow-y-auto max-h-[90vh] px-6 sm:px-[50px] py-[25px] sm:py-[30px] relative rounded-[32px] sm:rounded-[45px] w-full max-w-2xl shadow-2xl"
    >
      <div className="flex items-center justify-between w-full">
        <h2 className="font-['Google_Sans_Flex:Bold',sans-serif] font-bold text-[28px] text-black">
          {header}
        </h2>
      </div>

      {/* Opcoes do Formulário */}
      <div className="flex flex-col gap-5 w-full">
        {/* Nome */}
        <div className="flex flex-col gap-1 w-full">
          <label className="font-bold text-sm text-black">
            Nome do Programa
          </label>
          <input
            type="text"
            placeholder="Insira o nome do programa..."
            required
            value={formNome}
            onChange={(e) => setFormNome(e.target.value)}
            className="bg-[#d9d9d9] h-[45px] px-3 rounded-[15px] border-none outline-none text-[15px] text-slate-700"
          />
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-1 w-full">
          <label className="font-bold text-sm text-black">
            Descrição curta
          </label>
          <textarea
            placeholder="Insira uma descrição..."
            required
            value={formDescricao}
            onChange={(e) => setFormDescricao(e.target.value)}
            className="bg-[#d9d9d9] min-h-[80px] p-3 rounded-[15px] border-none outline-none text-[15px] text-slate-700 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Data de Início */}
          <div className="flex flex-col gap-1 w-full">
            <label className="font-bold text-sm text-black">
              Data de Início
            </label>
            <input
              type="date"
              value={formData ? formData.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const novaData = e.target.value
                  ? new Date(e.target.value + 'T00:00:00')
                  : new Date();
                setFormData(novaData);
              }}
              className="bg-[#d9d9d9] h-[45px] px-3 rounded-[15px] border-none outline-none text-[15px] text-slate-700"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1 w-full">
            <label className="font-bold text-sm text-black">Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className="bg-[#d5e4d1] h-[45px] px-3 rounded-[15px] border-none outline-none font-bold text-xs cursor-pointer text-black"
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Núcleo */}
          <div className="flex flex-col gap-1 w-full">
            <label className="font-bold text-sm text-black">
              Núcleo Responsável
            </label>
            <select
              value={formNucleo?.id || ''}
              onChange={(e) => {
                const n = UsuarioAtual.nucleos.find(
                  (item) => item.id === e.target.value,
                );
                setFormNucleo(n);
              }}
              required
              className="bg-[#d8d0d8] h-[45px] px-3 rounded-[15px] border-none outline-none font-bold text-xs cursor-pointer text-black"
            >
              <option value="" disabled>
                Selecione um núcleo...
              </option>
              {UsuarioAtual.nucleos.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nome} ({n.sigla})
                </option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div className="flex flex-col gap-1 w-full">
            <label className="font-bold text-sm text-black">
              Responsável pelo Programa
            </label>
            <select
              value={formResponsavel?.id || ''}
              onChange={(e) => {
                const u = listaUsuarios.find(
                  (item) => item.id === e.target.value,
                );
                setFormResponsavel(u);
              }}
              required
              className="bg-[#ffdfbf] h-[45px] px-3 rounded-[15px] border-none outline-none font-bold text-xs cursor-pointer text-black"
            >
              <option value="" disabled>
                Selecione um responsável...
              </option>
              {listaUsuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Participantes */}
        <div className="flex flex-col gap-2 w-full">
          <label className="font-bold text-sm text-black">
            Participantes do Programa
          </label>
          <select
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              const usuario = listaUsuarios.find((u) => u.id === id);
              if (usuario && !formParticipantes.some((u) => u.id === id)) {
                setFormParticipantes([...formParticipantes, usuario]);
              }
              e.target.value = '';
            }}
            className="bg-[#d8d0d8] h-[40px] px-3 rounded-xl font-bold text-xs outline-none cursor-pointer text-black"
            defaultValue=""
          >
            <option value="" disabled>
              Adicionar participante...
            </option>
            {listaUsuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome} {u.email ? `(${u.email})` : ''}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1.5 min-h-[45px] p-2 bg-slate-100 rounded-xl border border-slate-200">
            {formParticipantes.length > 0 ? (
              formParticipantes.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1 bg-[#3b142f] text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs"
                >
                  {u.nome}
                  <button
                    type="button"
                    onClick={() =>
                      setFormParticipantes(
                        formParticipantes.filter((item) => item.id !== u.id),
                      )
                    }
                    className="hover:text-red-300 font-bold ml-1 cursor-pointer"
                    title="Remover"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-xs italic self-center">
                Nenhum participante adicionado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-[25px] items-center justify-center w-full pt-2">
        <button
          type="button"
          onClick={onClose}
          className="border-2 border-[#3b142f] border-solid cursor-pointer flex-1 py-3 rounded-[100px] text-[#3b142f] font-semibold text-center"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-[#3b142f] cursor-pointer flex-1 py-3 rounded-[100px] text-white font-semibold text-center"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
