import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from './NavBar';
import { User } from './UserBar';
import {
  FolderKanban,
  BarChart3,
  Download,
  ChevronDown,
  TrendingUp,
  Users,
  TrendingDown,
  Search,
  X,
  Camera,
  Palette,
  Tag,
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
  LabelList,
} from 'recharts';
import { UsuarioAtual } from './dados/usuarios';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { API_BASE_URL } from './config/api';

interface RegistroDashboard {
  id?: string;
  ano?: number;
  trimestre: string;
  valorRealizado: string | number | null;
  metaAplicada: string | number | null;
  statusAprovacao: string;
}

interface IndicadorDashboard {
  id: string;
  codigo?: string | null;
  nome: string;
  tipoDado?: string;
  unidadeMedida: string | null;
  escopo?: string;
  nucleo: {
    id: string;
    nome: string;
    sigla: string;
    corHex?: string | null;
  } | null;
  programa: {
    id: string;
    nome: string;
  } | null;
  meta?: number | null;
  realizado?: number | null;
  percentualAtingido?: number | null;
  registros: RegistroDashboard[];
}

interface DashboardApiResponse {
  ano: number;
  trimestre: string | null;
  total: number;
  indicadores: IndicadorDashboard[];
}

function CardMetrica({
  TipoMetrica,
  valAtual,
  valVariacao,
  corBg,
}: {
  TipoMetrica: string;
  valAtual: number;
  valVariacao: number;
  corBg: string;
}) {
  let leTitulo = '';
  switch (TipoMetrica) {
    case 'programas':
      leTitulo = 'Programas em Execução';
      break;
    case 'indicadores':
      leTitulo = 'Indicadores Cadastrados';
      break;
    default:
      leTitulo = 'Total de Usuários';
      break;
  }

  const varUsers = valVariacao;

  return (
    <div
      className={
        corBg +
        ' w-full min-h-[110px] p-4 sm:p-5 rounded-2xl border border-[#f5e1ed] shadow-xs flex items-center gap-3.5 sm:gap-4'
      }
    >
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#832b62] text-white flex items-center justify-center shrink-0 shadow-xs">
        {TipoMetrica === 'programas' ? (
          <FolderKanban size={22} />
        ) : TipoMetrica === 'indicadores' ? (
          <BarChart3 size={22} />
        ) : (
          <Users size={22} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight block">
          {valAtual}
        </span>
        <p
          className="text-xs text-slate-500 font-medium truncate mt-0.5"
          title={leTitulo}
        >
          {leTitulo}
        </p>
        <div
          className={`text-[11px] font-semibold flex items-center gap-1.5 mt-1 leading-snug flex-wrap ${
            varUsers >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          <span className="flex items-center gap-1 shrink-0">
            {varUsers >= 0 ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {varUsers >= 0 ? `+${varUsers}%` : `${varUsers}%`}
          </span>
          <span className="text-slate-500 font-normal">
            em relação ao período anterior
          </span>
        </div>
      </div>
    </div>
  );
}

const PALETA_CORES = [
  { nome: 'Vinho IPÊ', hex: '#832b62' },
  { nome: 'Azul', hex: '#2563eb' },
  { nome: 'Verde', hex: '#059669' },
  { nome: 'Laranja', hex: '#d97706' },
  { nome: 'Roxo', hex: '#7c3aed' },
  { nome: 'Vermelho', hex: '#dc2626' },
  { nome: 'Ciano', hex: '#0891b2' },
];

function ajustarBrilho(hex: string, porcentagem: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round(255 * (porcentagem / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (porcentagem / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (porcentagem / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function gerarTonsFatia(corBase: string): string[] {
  return [
    corBase,
    ajustarBrilho(corBase, 20),
    ajustarBrilho(corBase, 40),
    ajustarBrilho(corBase, -20),
    ajustarBrilho(corBase, 60),
  ];
}

export default function TelaDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const indicadorIdParam = searchParams.get('indicadorId');
  const nomeParam = searchParams.get('nome');

  const [pesquisaTexto, setPesquisaTexto] = useState('');
  const [nucleoFiltro, setNucleoFiltro] = useState('Todos os Núcleos');
  const [programaFiltro, setProgramaFiltro] = useState('Todos os Programas');
  const [programasDoBanco, setProgramasDoBanco] = useState<
    { id: string; nome: string; nucleoId?: string | null }[]
  >([]);
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
  const [tiposGraficos, setTiposGraficos] = useState<Record<string, string>>(
    {},
  );
  const [corPadraoGlobal, setCorPadraoGlobal] = useState('#832b62');
  const [coresGraficos, setCoresGraficos] = useState<Record<string, string>>(
    {},
  );
  const [exibirValores, setExibirValores] = useState(true);
  const [exportando, setExportando] = useState<string | null>(null);

  const exportarCSV = () => {
    const linhas = indicadoresFiltrados.flatMap((indicador) =>
      filtrarRegistrosPorPeriodo(indicador.registros).map((registro) => ({
        Indicador: indicador.nome,
        Nucleo: indicador.nucleo?.sigla ?? 'Institucional',
        Programa: indicador.programa?.nome ?? 'Geral',
        Ano: registro.ano ?? 2026,
        Trimestre: registro.trimestre,
        Valor: registro.valorRealizado,
        Meta: registro.metaAplicada ?? indicador.meta,
      })),
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
        Programa: indicador.programa?.nome ?? 'Geral',
        Ano: registro.ano ?? 2026,
        Trimestre: registro.trimestre,
        Valor: registro.valorRealizado,
        Meta: registro.metaAplicada ?? indicador.meta,
      })),
    );

    const dadosProgramas = dadosProgramasPorNucleo.map((item) => ({
      Nucleo: item.nucleo,
      ProgramasAtivos: item.programas,
    }));

    // Terceira aba: Resumo Executivo
    const resumoExecutivo = [
      { Informacao: 'RELATÓRIO EXECUTIVO - PROJETO IPÊ', Valor: '' },
      {
        Informacao: 'Data da exportação',
        Valor: new Date().toLocaleDateString('pt-BR'),
      },
      { Informacao: 'Núcleo selecionado', Valor: nucleoFiltro },
      { Informacao: 'Período selecionado', Valor: periodoFiltro },
      { Informacao: '', Valor: '' },
      { Informacao: 'INDICADORES GERAIS', Valor: '' },
      { Informacao: 'Total de usuários ativos', Valor: totalUsuarios },
      { Informacao: 'Total de programas ativos', Valor: totalProgramas },
      {
        Informacao: 'Total de indicadores cadastrados',
        Valor: indicadores.length,
      },
      {
        Informacao: 'Indicadores no filtro atual',
        Valor: indicadoresFiltrados.length,
      },
      {
        Informacao: 'Registros históricos exportados',
        Valor: dadosIndicadores.length,
      },
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
      'Indicadores',
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(dadosProgramas),
      'Programas por Nucleo',
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(resumoExecutivo),
      'Resumo Executivo',
    );

    XLSX.writeFile(workbook, 'dashboard-ipe.xlsx');
  };

  const exportarPDF = async () => {
    const dashboard = document.getElementById('dashboard-export');
    const headerEl = document.getElementById('dashboard-pdf-header');

    if (!dashboard || !headerEl) {
      alert(
        'Não foi possível localizar o conteúdo do dashboard para exportação.',
      );
      return;
    }

    setExportando('pdf');

    const alturaOriginal = dashboard.style.height;
    const overflowOriginal = dashboard.style.overflow;

    try {
      // Garante que o layout esteja completo no fluxo normal para captura
      dashboard.style.height = 'auto';
      dashboard.style.overflow = 'visible';

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

      const filterNoExport = (node: HTMLElement) => {
        if (
          node instanceof HTMLElement &&
          (node.classList.contains('no-export') ||
            node.id === 'menu-exportacao')
        ) {
          return false;
        }
        return true;
      };

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const larguraPagina = pdf.internal.pageSize.getWidth(); // 297 mm
      const alturaPagina = pdf.internal.pageSize.getHeight(); // 210 mm

      const margem = 12;
      const larguraDisponivel = larguraPagina - margem * 2; // 273 mm
      const espacoRodape = 10;

      let currentY = margem;

      // 1. Captura e renderiza Cabeçalho e Métricas
      const imagemHeader = await toPng(headerEl, {
        pixelRatio: 2,
        backgroundColor: '#f8fafc',
        filter: filterNoExport,
        skipFonts: true,
      });

      const propsHeader = pdf.getImageProperties(imagemHeader);
      const alturaHeader =
        (propsHeader.height * larguraDisponivel) / propsHeader.width;

      pdf.addImage(
        imagemHeader,
        'PNG',
        margem,
        currentY,
        larguraDisponivel,
        alturaHeader,
      );

      currentY += alturaHeader + 6;

      // 2. Captura e renderiza Cards de Gráficos evitando cortes em quebras de página
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>('.card-grafico-item'),
      );

      if (cards.length === 1) {
        const card = cards[0];
        const img = await toPng(card, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          filter: filterNoExport,
          skipFonts: true,
        });
        const props = pdf.getImageProperties(img);
        const cardWidth = Math.min(larguraDisponivel, 180);
        const h = (props.height * cardWidth) / props.width;
        const xPos = margem + (larguraDisponivel - cardWidth) / 2;

        if (currentY + h > alturaPagina - margem - espacoRodape) {
          pdf.addPage();
          currentY = margem;
        }

        pdf.addImage(img, 'PNG', xPos, currentY, cardWidth, h);
      } else if (cards.length > 1) {
        const colGap = 6;
        const colWidth = (larguraDisponivel - colGap) / 2;

        for (let i = 0; i < cards.length; i += 2) {
          const card1 = cards[i];
          const card2 = i + 1 < cards.length ? cards[i + 1] : null;

          const img1 = await toPng(card1, {
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            filter: filterNoExport,
            skipFonts: true,
          });
          const props1 = pdf.getImageProperties(img1);
          const h1 = (props1.height * colWidth) / props1.width;

          let img2: string | null = null;
          let h2 = 0;
          if (card2) {
            img2 = await toPng(card2, {
              pixelRatio: 2,
              backgroundColor: '#ffffff',
              filter: filterNoExport,
              skipFonts: true,
            });
            const props2 = pdf.getImageProperties(img2);
            h2 = (props2.height * colWidth) / props2.width;
          }

          const alturaLinha = Math.max(h1, h2);

          // Se a linha não couber no espaço restante da página, move para nova página
          if (currentY + alturaLinha > alturaPagina - margem - espacoRodape) {
            pdf.addPage();
            currentY = margem;
          }

          pdf.addImage(img1, 'PNG', margem, currentY, colWidth, h1);

          if (card2 && img2) {
            pdf.addImage(
              img2,
              'PNG',
              margem + colWidth + colGap,
              currentY,
              colWidth,
              h2,
            );
          }

          currentY += alturaLinha + colGap;
        }
      }

      // 3. Rodapé Institucional e Numeração em todas as páginas
      const totalPaginas = pdf.getNumberOfPages();
      for (let p = 1; p <= totalPaginas; p++) {
        pdf.setPage(p);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);

        // Linha separadora
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);
        pdf.line(
          margem,
          alturaPagina - margem - 3,
          larguraPagina - margem,
          alturaPagina - margem - 3,
        );

        pdf.text(
          'Instituto de Pesquisas e Ensino (IPÊ) • Dashboard de Indicadores',
          margem,
          alturaPagina - margem + 1,
        );

        const dataHoje = new Date().toLocaleDateString('pt-BR');
        const rodapeDireito = `${dataHoje} • Página ${p} de ${totalPaginas}`;
        const larguraTexto = pdf.getTextWidth(rodapeDireito);
        pdf.text(
          rodapeDireito,
          larguraPagina - margem - larguraTexto,
          alturaPagina - margem + 1,
        );
      }

      pdf.save('dashboard-ipe.pdf');
    } catch (erro) {
      console.error('Erro ao exportar PDF:', erro);
      alert('Não foi possível gerar o PDF.');
    } finally {
      dashboard.style.height = alturaOriginal;
      dashboard.style.overflow = overflowOriginal;
      setExportando(null);
    }
  };

  const exportarDashboardPNG = async () => {
    const dashboard = document.getElementById('dashboard-export');
    if (!dashboard) {
      alert('Não foi possível localizar o dashboard.');
      return;
    }

    setExportando('png');

    const alturaOriginal = dashboard.style.height;
    const overflowOriginal = dashboard.style.overflow;

    try {
      const alturaCompleta = dashboard.scrollHeight;
      dashboard.style.height = `${alturaCompleta}px`;
      dashboard.style.overflow = 'visible';

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

      const imagem = await toPng(dashboard, {
        pixelRatio: 2,
        backgroundColor: '#f8fafc',
        skipFonts: true,
        filter: (node) => {
          if (
            node instanceof HTMLElement &&
            (node.classList.contains('no-export') ||
              node.id === 'menu-exportacao')
          ) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = 'dashboard-ipe.png';
      link.href = imagem;
      link.click();
    } catch (erro) {
      console.error('Erro ao exportar PNG do painel:', erro);
      alert('Não foi possível gerar a imagem do dashboard.');
    } finally {
      dashboard.style.height = alturaOriginal;
      dashboard.style.overflow = overflowOriginal;
      setExportando(null);
    }
  };

  const exportarCardPNG = async (cardId: string, titulo: string) => {
    const card = document.getElementById(cardId);
    if (!card) {
      alert('Não foi possível localizar o gráfico para exportação.');
      return;
    }

    setExportando(cardId);

    try {
      const dataUrl = await toPng(card, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        filter: (node) => {
          if (
            node instanceof HTMLElement &&
            (node.classList.contains('no-export') ||
              node.id === 'menu-exportacao')
          ) {
            return false;
          }
          return true;
        },
      });

      const nomeLimpo = titulo
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const link = document.createElement('a');
      link.download = `indicador-${nomeLimpo || 'grafico'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (erro) {
      console.error('Erro ao exportar imagem PNG:', erro);
      alert('Não foi possível gerar a imagem PNG do gráfico.');
    } finally {
      setExportando(null);
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

      setCarregando(true);

      try {
        const anosParaBuscar: number[] = [];
        if (periodoFiltro === 'Ano de 2026') {
          anosParaBuscar.push(2026);
        } else if (periodoFiltro === 'Ano de 2025') {
          anosParaBuscar.push(2025);
        } else if (periodoFiltro === 'Ano de 2024') {
          anosParaBuscar.push(2024);
        } else if (
          periodoFiltro === 'Últimos 6 meses' ||
          periodoFiltro === 'Últimos 12 meses'
        ) {
          const anoAtual = new Date().getFullYear();
          anosParaBuscar.push(anoAtual, anoAtual - 1);
        } else {
          // 'Todos os períodos': carrega histórico consolidado de medições
          anosParaBuscar.push(2024, 2025, 2026);
        }

        const respostas = await Promise.all(
          anosParaBuscar.map(async (ano) => {
            const resp = await fetch(
              `${API_BASE_URL}/dashboard/indicators?ano=${ano}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (!resp.ok) return null;
            return (await resp.json()) as DashboardApiResponse;
          }),
        );

        const mapa = new Map<string, IndicadorDashboard>();

        for (const resposta of respostas) {
          if (!resposta?.indicadores) continue;

          for (const ind of resposta.indicadores) {
            const existente = mapa.get(ind.id);
            const registrosComAno = (ind.registros ?? []).map((r) => ({
              ...r,
              ano: r.ano ?? resposta.ano,
            }));

            if (!existente) {
              mapa.set(ind.id, {
                ...ind,
                registros: registrosComAno,
              });
            } else {
              const registrosExistentes = existente.registros ?? [];
              for (const reg of registrosComAno) {
                const jaExiste = registrosExistentes.some(
                  (ex) =>
                    (ex.ano ?? resposta.ano) === reg.ano &&
                    ex.trimestre === reg.trimestre,
                );
                if (!jaExiste) {
                  registrosExistentes.push(reg);
                }
              }
              existente.registros = registrosExistentes;
              if (ind.meta !== null && ind.meta !== undefined) {
                existente.meta = (existente.meta ?? 0) + ind.meta;
              }
              if (ind.realizado !== null && ind.realizado !== undefined) {
                existente.realizado =
                  (existente.realizado ?? 0) + ind.realizado;
              }
              if (
                existente.meta &&
                existente.realizado !== null &&
                existente.realizado !== undefined
              ) {
                existente.percentualAtingido =
                  Math.round((existente.realizado / existente.meta) * 1000) /
                  10;
              }
            }
          }
        }

        if (!cancelado) {
          setIndicadores(Array.from(mapa.values()));
          setErroIndicadores(null);
        }
      } catch (erro) {
        if (!cancelado) {
          setErroIndicadores(
            erro instanceof Error
              ? erro.message
              : 'Erro ao carregar indicadores do dashboard.',
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
  }, [periodoFiltro]);

  useEffect(() => {
    const carregarTotalUsuarios = async () => {
      try {
        const token = localStorage.getItem('access_token');

        const resposta = await fetch(`${API_BASE_URL}/users/contagem`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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

        const resposta = await fetch(`${API_BASE_URL}/programas/contagem`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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

    fetch(`${API_BASE_URL}/programas/por-nucleo`, {
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

  useEffect(() => {
    const carregarProgramas = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/programas?limite=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const dados = await res.json();
          const itens = Array.isArray(dados) ? dados : (dados.itens ?? []);
          setProgramasDoBanco(itens);
        }
      } catch (erro) {
        console.error(
          'Erro ao carregar programas para filtro do dashboard:',
          erro,
        );
      }
    };
    carregarProgramas();
  }, []);

  // Filtros combinados: Indicador específico via URL, Núcleo, Programa do banco e Barra de Pesquisa
  const indicadoresFiltrados = indicadores.filter((indicador) => {
    if (indicadorIdParam && indicador.id !== indicadorIdParam) {
      return false;
    }

    const matchNucleo =
      nucleoFiltro === 'Todos os Núcleos' ||
      indicador.nucleo?.sigla === nucleoFiltro;

    const matchPrograma =
      programaFiltro === 'Todos os Programas' ||
      indicador.programa?.nome === programaFiltro ||
      indicador.programa?.id === programaFiltro;

    const termo = pesquisaTexto.trim().toLowerCase();
    const matchPesquisa =
      !termo ||
      indicador.nome.toLowerCase().includes(termo) ||
      (indicador.programa?.nome &&
        indicador.programa.nome.toLowerCase().includes(termo)) ||
      (indicador.nucleo?.sigla &&
        indicador.nucleo.sigla.toLowerCase().includes(termo)) ||
      (indicador.codigo && indicador.codigo.toLowerCase().includes(termo));

    return matchNucleo && matchPrograma && matchPesquisa;
  });

  const agora = new Date();
  const indiceTrimestreAtual =
    agora.getFullYear() * 4 + Math.floor(agora.getMonth() / 3);

  const filtrarRegistrosPorPeriodo = (registros: RegistroDashboard[]) => {
    return registros.filter((registro) => {
      if (
        periodoFiltro === 'Todos os períodos' ||
        periodoFiltro.startsWith('Ano de')
      ) {
        return true;
      }

      const numeroTrimestre = Number(registro.trimestre.replace('Q', ''));

      if (numeroTrimestre < 1 || numeroTrimestre > 4) {
        return false;
      }

      const anoRegistro = registro.ano ?? agora.getFullYear();
      const indiceRegistro = anoRegistro * 4 + numeroTrimestre - 1;

      const quantidadeTrimestres = periodoFiltro === 'Últimos 6 meses' ? 2 : 4;

      return (
        indiceRegistro <= indiceTrimestreAtual &&
        indiceRegistro >= indiceTrimestreAtual - quantidadeTrimestres + 1
      );
    });
  };

  const dadosProgramasPorNucleo = UsuarioAtual.nucleos
    .filter(
      (nucleo) =>
        nucleoFiltro === 'Todos os Núcleos' || nucleo.sigla === nucleoFiltro,
    )
    .map((nucleo) => {
      const registro = programasPorNucleo.find(
        (item) => item.nucleoId === nucleo.id,
      );

      return {
        nucleo: nucleo.sigla,
        programas: registro?._count.id ?? 0,
      };
    });

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] overflow-hidden">
      {/* Sidebar Lateral */}
      <NavBar />

      {/* Conteúdo Principal */}
      <main
        id="dashboard-export"
        className="flex-1 px-4 sm:px-6 md:px-8 w-full h-full overflow-y-auto pt-4 sm:pt-6 md:pt-8 pb-20"
      >
        {/* Container do Cabeçalho e Métricas (usado também para exportação em PDF) */}
        <div id="dashboard-pdf-header">
          {/* Cabeçalho do Dashboard */}
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-sans font-normal text-[#a13680]">
                Dashboard
              </h1>
              <p className="font-sans font-light text-xs sm:text-sm text-slate-500 mt-1">
                Acompanhe os resultados dos núcleos, programas e indicadores
                institucionais
              </p>
              {/* Badges dos filtros ativos (úteis para PDF e visualização rápida) */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium">
                  Núcleo: {nucleoFiltro}
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium">
                  Programa: {programaFiltro}
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium">
                  Período: {periodoFiltro}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 no-export w-full xl:w-auto">
              {/* Barra de Pesquisa Rápida */}
              <div className="relative w-full sm:w-auto flex-1 sm:flex-initial min-w-[200px] sm:min-w-[240px]">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Buscar indicador ou programa..."
                  value={pesquisaTexto}
                  onChange={(e) => setPesquisaTexto(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg pl-8 pr-7 py-2 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-[#832b62] shadow-xs"
                />
                {pesquisaTexto && (
                  <button
                    type="button"
                    onClick={() => setPesquisaTexto('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Limpar busca"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filtro Núcleos */}
              <div className="relative">
                <select
                  value={nucleoFiltro}
                  onChange={(e) => setNucleoFiltro(e.target.value)}
                  className="appearance-none bg-[#832b62] text-white text-xs font-medium px-3.5 py-2 sm:py-2.5 pr-7 rounded-lg cursor-pointer focus:outline-none max-w-[160px] truncate"
                >
                  <option>Todos os Núcleos</option>
                  {UsuarioAtual.nucleos.map((n) => (
                    <option key={n.id} value={n.sigla}>
                      {n.sigla}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none"
                />
              </div>

              {/* Filtro Programas do Banco de Dados */}
              <div className="relative">
                <select
                  value={programaFiltro}
                  onChange={(e) => setProgramaFiltro(e.target.value)}
                  className="appearance-none bg-[#832b62] text-white text-xs font-medium px-3.5 py-2 sm:py-2.5 pr-7 rounded-lg cursor-pointer focus:outline-none max-w-[170px] truncate"
                >
                  <option>Todos os Programas</option>
                  {programasDoBanco
                    .filter((prog) => {
                      if (nucleoFiltro === 'Todos os Núcleos') return true;
                      const nucleoSelecionado = UsuarioAtual.nucleos.find(
                        (n) => n.sigla === nucleoFiltro,
                      );
                      return (
                        !prog.nucleoId ||
                        prog.nucleoId === nucleoSelecionado?.id
                      );
                    })
                    .map((p) => (
                      <option key={p.id} value={p.nome}>
                        {p.nome}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none"
                />
              </div>

              {/* Filtro Período */}
              <div className="relative">
                <select
                  value={periodoFiltro}
                  onChange={(e) => setPeriodoFiltro(e.target.value)}
                  className="appearance-none bg-[#832b62] text-white text-xs font-medium px-3.5 py-2 sm:py-2.5 pr-7 rounded-lg cursor-pointer focus:outline-none max-w-[150px] truncate"
                >
                  <option>Todos os períodos</option>
                  <option>Ano de 2026</option>
                  <option>Ano de 2025</option>
                  <option>Ano de 2024</option>
                  <option>Últimos 12 meses</option>
                  <option>Últimos 6 meses</option>
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none"
                />
              </div>

              {/* Seletor de Cor Geral dos Gráficos */}
              <div
                className="relative flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-xs"
                title="Cor padrão para todos os gráficos"
              >
                <Palette size={13} className="text-slate-500 shrink-0" />
                <span className="text-xs text-slate-600 font-medium hidden sm:inline">
                  Cor:
                </span>
                <div className="flex items-center gap-1">
                  {PALETA_CORES.slice(0, 5).map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => {
                        setCorPadraoGlobal(p.hex);
                        setCoresGraficos({});
                      }}
                      title={`Aplicar ${p.nome} em todos`}
                      style={{ backgroundColor: p.hex }}
                      className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                        corPadraoGlobal === p.hex
                          ? 'ring-2 ring-offset-1 ring-slate-400 scale-110'
                          : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                    />
                  ))}
                  <label
                    title="Escolher cor personalizada para todos"
                    className="relative w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden hover:scale-105"
                  >
                    <input
                      type="color"
                      value={corPadraoGlobal}
                      onChange={(e) => {
                        setCorPadraoGlobal(e.target.value);
                        setCoresGraficos({});
                      }}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Alternador de Rótulos / Valores nos Gráficos */}
              <button
                type="button"
                onClick={() => setExibirValores((prev) => !prev)}
                title={
                  exibirValores
                    ? 'Ocultar valores impressos nos gráficos'
                    : 'Exibir valores impressos nos gráficos'
                }
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 sm:py-2.5 rounded-lg border transition-colors cursor-pointer shadow-xs ${
                  exibirValores
                    ? 'bg-[#fcf2f7] border-[#832b62] text-[#832b62]'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Tag size={13} />
                <span>
                  {exibirValores
                    ? 'Valores nos Gráficos: Ativo'
                    : 'Mostrar Valores'}
                </span>
              </button>

              {/* Botão Exportar com Opções */}
              <div id="menu-exportacao" className="relative">
                <button
                  type="button"
                  disabled={exportando !== null}
                  onClick={() => setMenuExportacaoAberto(!menuExportacaoAberto)}
                  className="flex items-center gap-1.5 bg-[#4a1836] hover:bg-[#3a182d] text-white text-xs font-medium px-3.5 py-2 sm:py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  <Download size={13} />
                  <span>
                    {exportando === 'pdf'
                      ? 'Gerando PDF...'
                      : exportando === 'png'
                        ? 'Gerando PNG...'
                        : 'Exportar'}
                  </span>
                </button>

                <div
                  className={`absolute right-0 top-full mt-1 ${
                    menuExportacaoAberto ? 'block' : 'hidden'
                  } bg-white border border-gray-200 rounded-lg shadow-lg min-w-52 z-50 py-1`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuExportacaoAberto(false);
                      exportarCSV();
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 flex items-center gap-2 text-slate-700"
                  >
                    <Download size={13} className="text-slate-400" />
                    <span>Exportar CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuExportacaoAberto(false);
                      exportarExcel();
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 flex items-center gap-2 text-slate-700"
                  >
                    <Download size={13} className="text-slate-400" />
                    <span>Exportar Excel</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuExportacaoAberto(false);
                      exportarPDF();
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 flex items-center gap-2 text-slate-700"
                  >
                    <Download size={13} className="text-[#832b62]" />
                    <div>
                      <span className="font-medium text-slate-800">
                        Exportar PDF
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Relatório paginado sem cortes
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuExportacaoAberto(false);
                      exportarDashboardPNG();
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 flex items-center gap-2 text-slate-700"
                  >
                    <Camera size={13} className="text-[#832b62]" />
                    <div>
                      <span className="font-medium text-slate-800">
                        Exportar Imagem (PNG)
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Painel completo em alta resolução
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Grade de Cards Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            <CardMetrica
              TipoMetrica="usuario"
              valAtual={totalUsuarios}
              valVariacao={0}
              corBg="bg-[#fcf2f7]"
            />

            <CardMetrica
              TipoMetrica="programas"
              valAtual={totalProgramas}
              valVariacao={0}
              corBg="bg-[#f0f4f9]"
            />

            <CardMetrica
              TipoMetrica="indicadores"
              valAtual={indicadoresFiltrados.length}
              valVariacao={0}
              corBg="bg-[#fcf2f7]"
            />
          </div>

          {/* Banner de filtro focado em indicador único vindo da Tela de Indicadores */}
          {indicadorIdParam && (
            <div className="bg-[#fcf2f7] border border-[#f5e1ed] rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#832b62] text-white rounded-xl shadow-xs">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Visualização focada no indicador
                  </p>
                  <h2 className="text-base font-bold text-slate-900">
                    {indicadoresFiltrados[0]?.nome ||
                      nomeParam ||
                      'Indicador selecionado'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('indicadorId');
                  params.delete('nome');
                  setSearchParams(params);
                }}
                className="no-export flex items-center gap-1.5 text-xs bg-[#832b62] hover:bg-[#6e2352] text-white font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <span>Ver todos os indicadores</span>
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Seção de Gráficos */}
        {carregando && (
          <p className="text-sm text-slate-500">Carregando indicadores...</p>
        )}

        {erroIndicadores && (
          <p className="text-sm text-red-600" role="alert">
            {erroIndicadores}
          </p>
        )}

        {!carregando &&
          !erroIndicadores &&
          indicadoresFiltrados.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center my-6 shadow-xs">
              <p className="text-slate-700 font-semibold text-sm mb-1">
                Nenhum indicador encontrado para os filtros selecionados.
              </p>
              <p className="text-slate-400 text-xs mb-4">
                Tente buscar por outro termo, núcleo, programa ou período.
              </p>
              {(pesquisaTexto ||
                nucleoFiltro !== 'Todos os Núcleos' ||
                programaFiltro !== 'Todos os Programas' ||
                indicadorIdParam) && (
                <button
                  type="button"
                  onClick={() => {
                    setPesquisaTexto('');
                    setNucleoFiltro('Todos os Núcleos');
                    setProgramaFiltro('Todos os Programas');
                    if (indicadorIdParam) {
                      const params = new URLSearchParams(searchParams);
                      params.delete('indicadorId');
                      params.delete('nome');
                      setSearchParams(params);
                    }
                  }}
                  className="text-xs bg-[#832b62] text-white font-medium px-4 py-2 rounded-lg hover:bg-[#6e2352] transition-colors cursor-pointer"
                >
                  Limpar filtros de busca
                </button>
              )}
            </div>
          )}

        <div
          className={`grid gap-6 ${
            indicadorIdParam && indicadoresFiltrados.length === 1
              ? 'grid-cols-1 max-w-4xl'
              : 'grid-cols-1 lg:grid-cols-2'
          }`}
        >
          {indicadoresFiltrados.map((indicador) => {
            {
              /* Monta os dados históricos do indicador percorrendo o Map de TrimestresPassados */
            }
            const dadosHistoricoTrimestres = [
              ...filtrarRegistrosPorPeriodo(indicador.registros ?? []),
            ]
              .sort((a, b) => {
                const diferencaAno = (a.ano ?? 2026) - (b.ano ?? 2026);

                if (diferencaAno !== 0) return diferencaAno;

                return (
                  Number(a.trimestre.slice(1)) - Number(b.trimestre.slice(1))
                );
              })
              .map((registro) => {
                const valor = Number(registro.valorRealizado ?? 0);

                return {
                  periodo: `${registro.ano ?? ''}.${registro.trimestre.replace('Q', '')}`,
                  valor: Number.isFinite(valor) ? valor : 0,
                };
              });

            const corAtual = coresGraficos[indicador.id] || corPadraoGlobal;

            return (
              <div
                key={indicador.id}
                id={`card-grafico-${indicador.id}`}
                className="card-grafico-item bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px] flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 break-words flex-1">
                    {indicador.nome}
                  </h3>
                  <button
                    type="button"
                    disabled={exportando === `card-grafico-${indicador.id}`}
                    onClick={() =>
                      exportarCardPNG(
                        `card-grafico-${indicador.id}`,
                        indicador.nome,
                      )
                    }
                    className="no-export flex items-center gap-1.5 text-xs text-[#832b62] hover:text-white bg-[#fcf2f7] hover:bg-[#832b62] border border-[#f5e1ed] hover:border-[#832b62] px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    title="Baixar imagem deste gráfico em PNG (com informações do indicador)"
                  >
                    <Camera size={13} />
                    <span className="font-medium hidden sm:inline">
                      {exportando === `card-grafico-${indicador.id}`
                        ? 'Salvando...'
                        : 'Salvar PNG'}
                    </span>
                    <span className="font-medium sm:hidden">PNG</span>
                  </button>
                </div>
                <div className="mb-2 text-[11px] text-slate-500 space-y-0.5">
                  <div>
                    <span className="font-semibold text-slate-600">
                      Núcleo:
                    </span>{' '}
                    {indicador.nucleo?.sigla ?? 'Institucional'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">
                      Programa:
                    </span>{' '}
                    {indicador.programa?.nome ?? 'Geral'}
                  </div>
                </div>

                {/* Resumo Meta vs Realizado (calculado no backend) */}
                <div className="flex flex-wrap items-center gap-2 mb-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">
                      Realizado
                    </span>
                    <span className="font-bold text-slate-700">
                      {indicador.realizado !== null &&
                      indicador.realizado !== undefined
                        ? `${indicador.realizado} ${indicador.unidadeMedida ?? ''}`
                        : '0'}
                    </span>
                  </div>
                  <div className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">
                      Meta
                    </span>
                    <span className="font-bold text-slate-700">
                      {indicador.meta !== null && indicador.meta !== undefined
                        ? `${indicador.meta} ${indicador.unidadeMedida ?? ''}`
                        : 'Sem meta'}
                    </span>
                  </div>
                  {indicador.percentualAtingido !== null &&
                    indicador.percentualAtingido !== undefined && (
                      <div
                        className={`px-2.5 py-1 rounded-md border ${
                          indicador.percentualAtingido >= 100
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : indicador.percentualAtingido >= 70
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}
                      >
                        <span className="text-[10px] block uppercase font-medium">
                          Atingido
                        </span>
                        <span className="font-bold">
                          {indicador.percentualAtingido}%
                        </span>
                      </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 no-export">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Visualização</span>

                    <select
                      value={tiposGraficos[indicador.id] || 'area'}
                      onChange={(e) =>
                        setTiposGraficos((anteriores) => ({
                          ...anteriores,
                          [indicador.id]: e.target.value,
                        }))
                      }
                      className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="area">Área</option>
                      <option value="linha">Linha</option>
                      <option value="coluna">Colunas</option>
                      <option value="pizza">Pizza</option>
                      <option value="rosca">Rosca</option>
                    </select>
                  </div>

                  {/* Seletor de Cores do Gráfico */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Cor</span>
                    <div className="flex items-center gap-1">
                      {PALETA_CORES.map((paleta) => (
                        <button
                          key={paleta.hex}
                          type="button"
                          onClick={() =>
                            setCoresGraficos((ant) => ({
                              ...ant,
                              [indicador.id]: paleta.hex,
                            }))
                          }
                          title={paleta.nome}
                          style={{ backgroundColor: paleta.hex }}
                          className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                            corAtual === paleta.hex
                              ? 'ring-2 ring-offset-1 ring-slate-400 scale-110'
                              : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                        />
                      ))}
                      <label
                        title="Escolher cor personalizada"
                        className="relative w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden hover:scale-105"
                      >
                        <input
                          type="color"
                          value={corAtual}
                          onChange={(e) =>
                            setCoresGraficos((ant) => ({
                              ...ant,
                              [indicador.id]: e.target.value,
                            }))
                          }
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <Palette
                          size={10}
                          className="text-slate-500 pointer-events-none"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <>
                      {(tiposGraficos[indicador.id] || 'area') === 'area' && (
                        <AreaChart
                          data={dadosHistoricoTrimestres}
                          margin={{ top: 20, right: 15, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id={`corIndicador-${indicador.id}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={corAtual}
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor={corAtual}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="valor"
                            stroke={corAtual}
                            strokeWidth={3}
                            fill={`url(#corIndicador-${indicador.id})`}
                          >
                            {exibirValores && (
                              <LabelList
                                dataKey="valor"
                                position="top"
                                offset={8}
                                fill="#4a1836"
                                fontSize={11}
                                fontWeight={600}
                              />
                            )}
                          </Area>
                        </AreaChart>
                      )}

                      {tiposGraficos[indicador.id] === 'linha' && (
                        <LineChart
                          data={dadosHistoricoTrimestres}
                          margin={{ top: 20, right: 15, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="valor"
                            stroke={corAtual}
                            strokeWidth={3}
                          >
                            {exibirValores && (
                              <LabelList
                                dataKey="valor"
                                position="top"
                                offset={8}
                                fill="#4a1836"
                                fontSize={11}
                                fontWeight={600}
                              />
                            )}
                          </Line>
                        </LineChart>
                      )}

                      {tiposGraficos[indicador.id] === 'coluna' && (
                        <BarChart
                          data={dadosHistoricoTrimestres}
                          margin={{ top: 20, right: 15, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Bar
                            dataKey="valor"
                            fill={corAtual}
                            radius={[5, 5, 0, 0]}
                          >
                            {exibirValores && (
                              <LabelList
                                dataKey="valor"
                                position="top"
                                offset={6}
                                fill="#4a1836"
                                fontSize={11}
                                fontWeight={600}
                              />
                            )}
                          </Bar>
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
                            outerRadius={80}
                            innerRadius={
                              tiposGraficos[indicador.id] === 'rosca' ? 45 : 0
                            }
                            label={
                              exibirValores
                                ? ({ name, value }) => `${name}: ${value}`
                                : false
                            }
                            labelLine={exibirValores}
                          >
                            {dadosHistoricoTrimestres.map((_, index) => (
                              <Cell
                                key={`fatia-${indicador.id}-${index}`}
                                fill={gerarTonsFatia(corAtual)[index % 5]}
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

          {(() => {
            const corProgramas = coresGraficos['programas'] || corPadraoGlobal;
            return (
              <div
                id="card-grafico-programas"
                className="card-grafico-item bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px] flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      Programas em Execução por Núcleo
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Quantidade de programas ativos por núcleo
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={exportando === 'card-grafico-programas'}
                    onClick={() =>
                      exportarCardPNG(
                        'card-grafico-programas',
                        'programas_por_nucleo',
                      )
                    }
                    className="no-export flex items-center gap-1.5 text-xs text-[#832b62] hover:text-white bg-[#fcf2f7] hover:bg-[#832b62] border border-[#f5e1ed] hover:border-[#832b62] px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    title="Baixar imagem deste gráfico em PNG"
                  >
                    <Camera size={13} />
                    <span className="font-medium hidden sm:inline">
                      {exportando === 'card-grafico-programas'
                        ? 'Salvando...'
                        : 'Salvar PNG'}
                    </span>
                    <span className="font-medium sm:hidden">PNG</span>
                  </button>
                </div>

                {/* Seletor de Cores do Card de Programas */}
                <div className="flex items-center justify-end gap-1.5 mb-3 no-export">
                  <span className="text-xs text-slate-500">Cor</span>
                  <div className="flex items-center gap-1">
                    {PALETA_CORES.map((paleta) => (
                      <button
                        key={paleta.hex}
                        type="button"
                        onClick={() =>
                          setCoresGraficos((ant) => ({
                            ...ant,
                            programas: paleta.hex,
                          }))
                        }
                        title={paleta.nome}
                        style={{ backgroundColor: paleta.hex }}
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                          corProgramas === paleta.hex
                            ? 'ring-2 ring-offset-1 ring-slate-400 scale-110'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                    <label
                      title="Escolher cor personalizada"
                      className="relative w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden hover:scale-105"
                    >
                      <input
                        type="color"
                        value={corProgramas}
                        onChange={(e) =>
                          setCoresGraficos((ant) => ({
                            ...ant,
                            programas: e.target.value,
                          }))
                        }
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <Palette
                        size={10}
                        className="text-slate-500 pointer-events-none"
                      />
                    </label>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosProgramasPorNucleo}
                      margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
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
                        fill={corProgramas}
                        radius={[4, 4, 0, 0]}
                      >
                        {exibirValores && (
                          <LabelList
                            dataKey="programas"
                            position="top"
                            offset={6}
                            fill="#4a1836"
                            fontSize={11}
                            fontWeight={600}
                          />
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
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
    </div>
  );
}
