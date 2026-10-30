import { useEffect, useState } from 'react';
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
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { UsuarioAtual } from './dados/usuarios';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface RegistroDashboard {
  id: string;
  ano: number;
  trimestre: string;
  valorRealizado: string | number | null;
  metaAplicada: string | number | null;
  statusAprovacao: string;
}

interface IndicadorDashboard {
  id: string;
  nome: string;
  unidadeMedida: string | null;
  nucleo: {
    id: string;
    nome: string;
    sigla: string;
  } | null;
  registros: RegistroDashboard[];
}

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
  const [periodoFiltro, setPeriodoFiltro] = useState('Todos os períodos');
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [indicadores, setIndicadores] = useState<IndicadorDashboard[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroIndicadores, setErroIndicadores] = useState<string | null>(null);
  const [totalProgramas, setTotalProgramas] = useState(0);
  const [programasPorNucleo, setProgramasPorNucleo] = useState<
    { nucleoId: string | null; _count: { id: number } }[]
  >([]);
  const [menuExportacaoAberto, setMenuExportacaoAberto] = useState(false);
  const [tiposGraficos, setTiposGraficos] = useState<Record<string, string>>({});

  const exportarCSV = () => {
  const linhas = indicadoresFiltrados.flatMap((indicador) =>
    filtrarRegistrosPorPeriodo(indicador.registros).map((registro) => ({
      Indicador: indicador.nome,
      Nucleo: indicador.nucleo?.sigla ?? 'Institucional',
      Ano: registro.ano,
      Trimestre: registro.trimestre,
      Valor: registro.valorRealizado,
    }))
  );

  const planilha = XLSX.utils.json_to_sheet(linhas);
  const conteudo = XLSX.utils.sheet_to_csv(planilha);
  const arquivo = new Blob(['\uFEFF' + conteudo], {
    type: 'text/csv;charset=utf-8;',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(arquivo);
  link.download = 'dashboard-ipe.csv';
  link.click();
  URL.revokeObjectURL(link.href);
};


const exportarExcel = () => {
  const dadosIndicadores = indicadoresFiltrados.flatMap((indicador) =>
    filtrarRegistrosPorPeriodo(indicador.registros).map((registro) => ({
      Indicador: indicador.nome,
      Nucleo: indicador.nucleo?.sigla ?? 'Institucional',
      Ano: registro.ano,
      Trimestre: registro.trimestre,
      Valor: registro.valorRealizado,
    }))
  );

  const dadosProgramas = dadosProgramasPorNucleo.map((item) => ({
    Nucleo: item.nucleo,
    ProgramasAtivos: item.programas,
  }));

  // Terceira aba: Resumo Executivo
  const resumoExecutivo = [
    { Informacao: 'RELATÓRIO EXECUTIVO - PROJETO IPÊ', Valor: '' },
    { Informacao: 'Data da exportação', Valor: new Date().toLocaleDateString('pt-BR') },
    { Informacao: 'Núcleo selecionado', Valor: nucleoFiltro },
    { Informacao: 'Período selecionado', Valor: periodoFiltro },
    { Informacao: '', Valor: '' },
    { Informacao: 'INDICADORES GERAIS', Valor: '' },
    { Informacao: 'Total de usuários ativos', Valor: totalUsuarios },
    { Informacao: 'Total de programas ativos', Valor: totalProgramas },
    { Informacao: 'Total de indicadores cadastrados', Valor: indicadores.length },
    { Informacao: 'Indicadores no filtro atual', Valor: indicadoresFiltrados.length },
    { Informacao: 'Registros históricos exportados', Valor: dadosIndicadores.length },
    { Informacao: '', Valor: '' },
    { Informacao: 'PROGRAMAS POR NÚCLEO', Valor: '' },
    ...dadosProgramas.map((item) => ({
      Informacao: item.Nucleo,
      Valor: item.ProgramasAtivos,
    })),
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(dadosIndicadores),
    'Indicadores'
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(dadosProgramas),
    'Programas por Nucleo'
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(resumoExecutivo),
    'Resumo Executivo'
  );

  XLSX.writeFile(workbook, 'dashboard-ipe.xlsx');
};


const exportarPDF = async () => {
  const dashboard = document.getElementById('dashboard-export');

  if (!dashboard) {
    alert('Não foi possível localizar o dashboard.');
    return;
  }

  const alturaOriginal = dashboard.style.height;
  const overflowOriginal = dashboard.style.overflow;

  try {
    // Calcula a altura total, incluindo o conteúdo fora da tela
    const alturaCompleta = dashboard.scrollHeight;

    // Expande temporariamente o dashboard para capturar tudo
    dashboard.style.height = `${alturaCompleta}px`;
    dashboard.style.overflow = 'visible';

    // Aguarda a atualização visual
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve())
    );

    const imagem = await toPng(dashboard, {
      pixelRatio: 2,
      backgroundColor: '#f8fafc',
      filter: (node) => {
        return !(
          node instanceof HTMLElement &&
          node.id === 'menu-exportacao'
        );
      },
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const larguraPagina = pdf.internal.pageSize.getWidth();
    const alturaPagina = pdf.internal.pageSize.getHeight();

    const margem = 10;
    const larguraDisponivel = larguraPagina - margem * 2;
    const alturaDisponivel = alturaPagina - margem * 2;

    const propriedades = pdf.getImageProperties(imagem);

    // Mantém a proporção da imagem
    const proporcao = larguraDisponivel / propriedades.width;
    const larguraImagem = larguraDisponivel;
    const alturaImagem = propriedades.height * proporcao;

    // Calcula quantas páginas serão necessárias
    const totalPaginas = Math.ceil(
      alturaImagem / alturaDisponivel
    );

    for (let pagina = 0; pagina < totalPaginas; pagina++) {
      if (pagina > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        imagem,
        'PNG',
        margem,
        margem - pagina * alturaDisponivel,
        larguraImagem,
        alturaImagem
      );
    }

    pdf.save('dashboard-ipe.pdf');

  } catch (erro) {
    console.error('Erro ao exportar PDF:', erro);
    alert('Não foi possível gerar o PDF.');

  } finally {
    // Restaura o dashboard ao tamanho original
    dashboard.style.height = alturaOriginal;
    dashboard.style.overflow = overflowOriginal;
  }
};

  useEffect(() => {
    let cancelado = false;

    const carregarIndicadores = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        if (!cancelado) {
          setErroIndicadores('Sessão não encontrada. Faça login novamente.');
          setCarregando(false);
        }
        return;
      }

      try {
        const resposta = await fetch('http://localhost:3000/api/indicadores', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resposta.ok) {
          throw new Error(`Erro ao consultar indicadores: HTTP ${resposta.status}`);
        }

        const dados: unknown = await resposta.json();

        if (!Array.isArray(dados)) {
          throw new Error('A API retornou um formato inesperado.');
        }

        if (!cancelado) {
          setIndicadores(dados as IndicadorDashboard[]);
          setErroIndicadores(null);
        }
      } catch (erro) {
        if (!cancelado) {
          setErroIndicadores(
            erro instanceof Error ? erro.message : 'Erro ao carregar indicadores.'
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    };

    carregarIndicadores();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    const carregarTotalUsuarios = async () => {
      try {
        const token = localStorage.getItem('access_token');

        const resposta = await fetch(
          'http://localhost:3000/api/user/contagem',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!resposta.ok) {
          throw new Error('Erro ao buscar quantidade de usuários');
        }

        const quantidade: number = await resposta.json();
        setTotalUsuarios(quantidade);
      } catch (erro) {
        console.error('Erro ao carregar usuários:', erro);
      }
    };

    carregarTotalUsuarios();
  }, []);

  useEffect(() => {
    const carregarTotalProgramas = async () => {
      try {
        const token = localStorage.getItem('access_token');

        const resposta = await fetch(
          'http://localhost:3000/api/programas/contagem',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!resposta.ok) {
          throw new Error('Erro ao buscar quantidade de programas');
        }

        const quantidade: number = await resposta.json();
        setTotalProgramas(quantidade);
      } catch (erro) {
        console.error('Erro ao carregar programas:', erro);
      }
    };

    carregarTotalProgramas();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) return;

    fetch('http://localhost:3000/api/programas/por-nucleo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Erro ao buscar programas por núcleo');
        }
        return res.json();
      })
      .then((dados) => setProgramasPorNucleo(dados))
      .catch((erro) => console.error(erro));
  }, []);

const indicadoresFiltrados = indicadores.filter(
  (indicador) =>
    nucleoFiltro === 'Todos os Núcleos' ||
    indicador.nucleo?.sigla === nucleoFiltro
);

const agora = new Date();
const indiceTrimestreAtual =
  agora.getFullYear() * 4 + Math.floor(agora.getMonth() / 3);

const filtrarRegistrosPorPeriodo = (registros: RegistroDashboard[]) => {
  return registros.filter((registro) => {
    if (periodoFiltro === 'Todos os períodos') {
      return true;
    }

    if (periodoFiltro === 'Ano de 2026') {
      return registro.ano === 2026;
    }

    const numeroTrimestre = Number(registro.trimestre.replace('Q', ''));

    if (numeroTrimestre < 1 || numeroTrimestre > 4) {
      return false;
    }

    const indiceRegistro =
      registro.ano * 4 + numeroTrimestre - 1;

    const quantidadeTrimestres =
      periodoFiltro === 'Últimos 6 meses' ? 2 : 4;

    return (
      indiceRegistro <= indiceTrimestreAtual &&
      indiceRegistro >= indiceTrimestreAtual - quantidadeTrimestres + 1
    );
  });
};

  const dadosProgramasPorNucleo = UsuarioAtual.nucleos
    .filter(
      (nucleo) =>
        nucleoFiltro === 'Todos os Núcleos' ||
        nucleo.sigla === nucleoFiltro
    )
    .map((nucleo) => {
      const registro = programasPorNucleo.find(
        (item) => item.nucleoId === nucleo.id
      );

      return {
        nucleo: nucleo.sigla,
        programas: registro?._count.id ?? 0,
      };
    });
  
  return (
    <div className="flex h-screen bg-[#f8fafc]">
      
      {/* Sidebar Lateral */}
      <NavBar></NavBar>

      {/* Conteúdo Principal */}
      <main
        id="dashboard-export"
        className="flex-1 px-[30px] w-full h-full overflow-y-auto pt-[60px] pb-[25px]"
      >        
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
            <div id="menu-exportacao" className="relative">
              <select 
                value={nucleoFiltro}
                onChange={(e) => setNucleoFiltro(e.target.value)}
                className="appearance-none bg-[#832b62] text-white text-xs font-medium px-4 py-2.5 pr-8 rounded-lg cursor-pointer focus:outline-none"
              >
                <option>Todos os Núcleos</option>
                {
                  UsuarioAtual.nucleos.map((n) => (
                    <option key={n.id} value={n.sigla}>
                      {n.sigla}
                    </option>
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
                <option>Todos os períodos</option>
                <option>Últimos 12 meses</option>
                <option>Últimos 6 meses</option>
                <option>Ano de 2026</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>

            {/* Botão Exportar CSV */}
            <div className="relative">
              <button
                onClick={() => setMenuExportacaoAberto(!menuExportacaoAberto)}
                className="flex items-center gap-2 bg-[#4a1836] hover:bg-[#3a182d] text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>Exportar</span>
              </button>

              <div
                className={`absolute right-0 top-full mt-1 ${
                  menuExportacaoAberto ? 'block' : 'hidden'
                } bg-white border border-gray-200 rounded-lg shadow-lg min-w-40 z-50`}
              >
                <button
                  onClick={() => {
                    setMenuExportacaoAberto(false);
                    exportarCSV();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-100"
                >
                  Exportar CSV
                </button>

                <button
                  onClick={() => {
                    setMenuExportacaoAberto(false);
                    exportarExcel();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-100"
                >
                  Exportar Excel
                </button>

                <button
                  onClick={() => {
                    setMenuExportacaoAberto(false);
                    exportarPDF();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-100"
                >
                  Exportar PDF
                </button>
              </div>

            </div>
          </div>
        </header>

        {/* Grade de Cards Métricas */}
        <div className="content-stretch flex w-full gap-8 mb-8 h-30">
          
          <CardMetrica TipoMetrica='usuario' valAtual={totalUsuarios} valVariacao={0} corBg="bg-[#fcf2f7]"/>

          {/*<CardMetrica TipoMetrica='nucleos' valAtual={NucleosCadastrados.length} valVariacao={varUsers} corBg="bg-[#f0f4f9]"/>*/}

          <CardMetrica TipoMetrica='programas' valAtual={totalProgramas} valVariacao={0} corBg="bg-[#f0f4f9]"/>

          <CardMetrica TipoMetrica='indicadores' valAtual={indicadores.length} valVariacao={0} corBg="bg-[#fcf2f7]"/>

        </div>

        {/* Seção de Gráficos */}
        {carregando && (
          <p className="text-sm text-slate-500">
            Carregando indicadores...
          </p>
        )}

        {erroIndicadores && (
          <p className="text-sm text-red-600" role="alert">
            {erroIndicadores}
          </p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {indicadoresFiltrados.map((indicador) => {            
            {/* Monta os dados históricos do indicador percorrendo o Map de TrimestresPassados */}
            const dadosHistoricoTrimestres = [
              ...filtrarRegistrosPorPeriodo(indicador.registros ?? []),
            ]
              .sort((a, b) => {
                const diferencaAno = a.ano - b.ano;

                if (diferencaAno !== 0) return diferencaAno;

                return Number(a.trimestre.slice(1)) - Number(b.trimestre.slice(1));
              })
              .map((registro) => {
                const valor = Number(registro.valorRealizado ?? 0);

                return {
                  periodo: `${registro.ano}.${registro.trimestre.replace('Q', '')}`,
                  valor: Number.isFinite(valor) ? valor : 0,
                };
              });

            return (
              <div key={indicador.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px]">
                <h3 className="text-base font-bold text-slate-800 mb-1">{indicador.nome}</h3>
                                
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500">
                  Tipo de visualização
                </span>

                <select
                  value={tiposGraficos[indicador.id] || 'area'}
                  onChange={(e) =>
                    setTiposGraficos((anteriores) => ({
                      ...anteriores,
                      [indicador.id]: e.target.value,
                    }))
                  }
                  className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
                >
                  <option value="area">Área</option>
                  <option value="linha">Linha</option>
                  <option value="coluna">Colunas</option>
                  <option value="pizza">Pizza</option>
                  <option value="rosca">Rosca</option>
                </select>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <>
                    {(tiposGraficos[indicador.id] || 'area') === 'area' && (
                      <AreaChart data={dadosHistoricoTrimestres}>
                        <defs>
                          <linearGradient
                            id={`corIndicador-${indicador.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#832b62" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#832b62" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="valor"
                          stroke="#832b62"
                          strokeWidth={3}
                          fill={`url(#corIndicador-${indicador.id})`}
                        />
                      </AreaChart>
                    )}

                    {tiposGraficos[indicador.id] === 'linha' && (
                      <LineChart data={dadosHistoricoTrimestres}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="valor"
                          stroke="#832b62"
                          strokeWidth={3}
                        />
                      </LineChart>
                    )}

                    {tiposGraficos[indicador.id] === 'coluna' && (
                      <BarChart data={dadosHistoricoTrimestres}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="valor" fill="#832b62" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    )}

                    {(tiposGraficos[indicador.id] === 'pizza' ||
                      tiposGraficos[indicador.id] === 'rosca') && (
                      <PieChart>
                        <Tooltip />
                        <Legend />
                        <Pie
                          data={dadosHistoricoTrimestres}
                          dataKey="valor"
                          nameKey="periodo"
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          innerRadius={
                            tiposGraficos[indicador.id] === 'rosca' ? 50 : 0
                          }
                          label
                        >
                          {dadosHistoricoTrimestres.map((_, index) => (
                            <Cell
                              key={`fatia-${indicador.id}-${index}`}
                              fill={
                                ['#832b62', '#a13680', '#d18ab5', '#e8b9d5', '#6b3157'][
                                  index % 5
                                ]
                              }
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    )}
                  </>
                </ResponsiveContainer>
              </div>

              </div>
            );
          })}

    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-slate-800">
          Programas em Execução por Núcleo
        </h3>
      </div>

      <p className="text-xs text-slate-400 mb-6">
        Quantidade de programas ativos por núcleo
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dadosProgramasPorNucleo}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />

            <XAxis
              dataKey="nucleo"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
            />

            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                borderColor: '#f1f5f9',
              }}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />

            <Bar
              dataKey="programas"
              name="Programas"
              fill="#832b62"
              radius={[4, 4, 0, 0]}
            />
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