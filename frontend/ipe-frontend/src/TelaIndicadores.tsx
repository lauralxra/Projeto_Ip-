import React, { useEffect, useState } from 'react';
import { Svg } from "./config/assets";
import { NavBar } from './NavBar';
import { User } from './UserBar';
import { BtnCriar } from './BtnCriar';
import { CustomDropdown } from './CustomDropdown';
import { CheckCircle2, Circle } from 'lucide-react';
import type { Programa } from './dados/programas';
import { type Indicador } from './dados/indicadores';
import { Search } from 'lucide-react';
import { UsuarioAtual } from './dados/usuarios';
import type { Nucleo } from './dados/nucleos';

function TotalProgresso({ progresso }: { progresso: number }) {
    // Cálculo matemático para preencher o círculo SVG proporcionalmente
    // O raio do círculo é 82.5, logo a circunferência aproximada é 2 * pi * 82.5 ≈ 518.36
    const raio = 82.5;
    const circunferencia = 2 * Math.PI * raio;
    const progressoSeguro = Number.isFinite(progresso) ? Math.max(0, Math.min(progresso, 100)) : 0;
    const deslocamento = circunferencia - (circunferencia * progressoSeguro) / 100;  

    return (
    <div className="border-2 border-[#3b142f] border-solid flex flex-1 flex-col gap-[12px] items-center justify-center min-w-[200px] px-[10px] py-[16px] rounded-[10px]" data-name="TotalProgresso">
        
        <p className="font-semibold text-[#3c3b3b] text-[18px] text-center w-full">
            Progresso geral
        </p>

        <div className="inline-grid leading-[0] size-[130px] place-items-start relative shrink-0" data-name="Barra">
            {/* Circulo SVG Dinâmico */}
            <div className="col-1 size-[130px] row-1">
                <svg className="absolute block inset-0 size-full -rotate-90" height="130" viewBox="0 0 182 182" width="130">
                    <g id="Group 69">
                    {/* Círculo de fundo cinza */}
                    <circle cx="91" cy="91" id="Ellipse 35" r={raio} stroke="#D0CFCF" strokeWidth="17" fill="none" />
                    
                    {/* Círculo de progresso dinâmico */}
                    <circle 
                      cx="91" 
                      cy="91" 
                      id="Ellipse 36" 
                      r={raio} 
                      stroke="url(#paint0_linear_0_44)" 
                      strokeLinecap="round" 
                      strokeWidth="17" 
                      fill="none"
                      strokeDasharray={circunferencia}
                      strokeDashoffset={deslocamento}
                      style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                  </g>
                  <defs>
                    <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_0_44" x1="9.5" x2="192.5" y1="100" y2="98">
                        <stop offset="0.524038" stopColor="#3B142F" />
                        <stop offset="1" stopColor="#A13680" />
                    </linearGradient>
                  </defs>
              </svg>
            </div>

            {/* Porcentagem */}
            <p className="col-1 font-normal ml-[42px] mt-[52px] absolute align-center justify-center row-1 text-[#3c3b3b] text-[18px]">
                {progressoSeguro}%
            </p>
        </div>
    </div>
  );
}

function TotalIndicadores({ valor }: { valor: number }) {
  return (
    <div className="border-2 border-[#3b142f] border-solid flex flex-1 flex-col gap-[8px] h-[200px] items-center justify-center min-w-[200px] px-[10px] py-[16px] rounded-[10px] text-[#3c3b3b] text-center" data-name="TotalIndicadores">
      <p className="font-semibold text-[18px] w-full">
        Total de indicadores
      </p>
      <div className="flex flex-col font-normal justify-center text-[36px] w-full">
        <p className="leading-[normal]">{valor}</p>
      </div>
    </div>
  );
}

function TotalParticipantes() {
  return (
    <div className="border-2 border-[#3b142f] border-solid flex flex-1 flex-col gap-[8px] h-[200px] items-center justify-center min-w-[200px] px-[10px] py-[16px] rounded-[10px] text-[#3c3b3b] text-center" data-name="TotalParticipantes">
      <p className="font-semibold text-[18px] w-full">
        Participantes ativos
      </p>
      <div className="flex flex-col font-normal justify-center text-[36px] w-full">
        <p className="leading-[normal]">13</p>
      </div>
    </div>
  );
}

function BtnImportIco({ ico, id }: { ico: string, id: string }) {
  return (
    <div className="flex items-center justify-center size-[24px]">
      <div className="flex-none rotate-90">
        <div className="size-[24px]" data-name={id}>
          <svg className={ico} fill="none" viewBox="0 0 34 34">
            <g id="btnDeslogar">
              <path d={Svg.p324b2780} fill="#3B142F"/>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

function Top() {
  return (
    <div className="bg-[#3b142f] flex items-center justify-between min-h-[48px] px-[20px] py-[8px] rounded-t-[24px] w-full">
        <div className="flex flex-1 items-center justify-center">
          <p className="font-normal text-[15px] text-white">Indicador</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
            <p className="font-normal text-[15px] text-white">Unidade</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
            <p className="font-normal text-[15px] text-white">Meta</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
            <p className="font-normal text-[15px] text-white">Realizado</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
            <p className="font-normal text-[15px] text-white">Progresso</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
            <p className="font-normal text-[15px] text-white">Ações</p>
        </div>
    </div>
  );
}

function Lista( { leList, editIndic, setIndicVal, delIndic, aprovIndic }: { leList:Indicador[],
                                                        editIndic:(arg0: Indicador) => void,
                                                        setIndicVal:(indic: Indicador) => void, 
                                                        delIndic:(indic: Indicador) => void,
                                                        aprovIndic:(indic: Indicador) => void }) {
    return (
        <div className="flex flex-col items-center justify-start gap-[12px] w-full">
            {leList.map((indicador) => {
                const numRealizado = parseFloat(indicador.valAtual) || 0;
                const numMeta = parseFloat(indicador.meta || '0');
                
                let progressoPercent = 0;
                if (numMeta > 0) {
                    progressoPercent = Math.min((numRealizado / numMeta) * 100, 100);
                }
                
                return (
                <div 
                  key={indicador.id} 
                  className="bg-[#f2eff4] rounded-xl px-[20px] py-[12px] flex items-center justify-between gap-[15px] shadow-xs hover:shadow-md transition-shadow w-full"
                >
                    <div className="flex items-center justify-between min-h-[40px] w-full text-[15px]">
                        <div className="flex flex-1 flex-col font-normal justify-center text-black">
                            <p>{indicador.nome}</p>
                        </div>
                        <div className="flex flex-1 flex-col font-normal justify-center text-black">
                            <p>{indicador.unidade}</p>
                        </div>

                        <div className="flex flex-1 flex-col font-normal justify-center text-black">
                            <p>{indicador.meta != null ? (indicador.meta + (indicador.simbolUni ? indicador.simbolUni : '')) : "Sem meta"}</p>
                        </div>

                        {UsuarioAtual.tipo == "ADM" || UsuarioAtual.tipo == "DN" ?
                            <>{/* Realizado */}
                            <button title="Definir Valor Atual" onClick={() => setIndicVal(indicador)} className="flex flex-1 gap-[16px] items-center cursor-pointer">
                                <p className="font-normal text-[#3c3b3b] whitespace-nowrap">
                                    {indicador.valAtual + (indicador.simbolUni ? indicador.simbolUni : '')}
                                </p>

                                {/* Botao Editar */}
                                <div className="flex items-center p-[2px] size-[14px]">
                                    <svg className="block size-full" fill="none" viewBox="0 0 14.6791 14.6795">
                                        <path d={Svg.p1dac9e00} stroke="#3B142F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                        <path d={Svg.pa46f980} stroke="#3B142F" strokeWidth="2" />
                                    </svg>
                                </div>
                            </button>
                            </>
                            :
                            <>
                            <div className="flex flex-1 gap-[16px] items-center cursor-pointer">
                                <p className="font-normal text-[#3c3b3b] whitespace-nowrap">
                                    {indicador.valAtual + (indicador.simbolUni ? indicador.simbolUni : '')}
                                </p>
                            </div>
                            </>
                        }
                        
                        {/* Container barra */}
                        <div className="flex items-center flex-1">
                            <div className="bg-[#c2c2c2] flex flex-col h-[8px] items-start rounded-[100px] w-[90px] overflow-hidden">
                                <div className="bg-gradient-to-r from-[#3b142f] to-[#77275e] h-full rounded-[100px] w-[60%]" 
                                style={{ width: `${progressoPercent}%` }} />
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-1 gap-[12px] items-center">
                            {UsuarioAtual.tipo == "ADM" ?
                                <button title="Editar Indicador" onClick={() => editIndic(indicador)} className="size-[24px] cursor-pointer">
                                    <svg className="block size-full" fill="none" viewBox="0 0 39 39">
                                    <path d={Svg.p36224900} fill="#3C3B3B" />
                                    </svg>
                                </button>
                                : ""
                            }
                            
                            <a title="Ver nos Dashboards" className="size-[24px]" href='/dashboard'>
                              <div className="size-full">
                                <svg className="block size-full" fill="none" viewBox="0 0 32.5 32.5001">
                                  <path d={Svg.p19cd0a80} fill="#3C3B3B" />
                                </svg>
                              </div>
                            </a>

                            {UsuarioAtual.tipo == "ADM" ?
                                <button title="Excluir Indicador" onClick={() => delIndic(indicador)} className="size-[24px] cursor-pointer">
                                    <svg className="block size-full" fill="none" viewBox="0 0 31.6875 36.5625">
                                    <path d={Svg.p38953980} fill="#3C3B3B" />
                                    </svg>
                                </button> : ""
                            }

                            {UsuarioAtual.tipo == "ADM" ?
                                <button title="Definir Aprovação" onClick={() => aprovIndic(indicador)} className="size-[24px] cursor-pointer">
                                    {indicador.aprovado ? <CheckCircle2 /> : <Circle />}
                                </button>
                                :
                                <div title={indicador.aprovado ? "Aprovado para Publicação" : "Não Aprovado para Publicação"} className="size-[24px]">
                                    {indicador.aprovado ? <CheckCircle2 /> : <Circle />}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            )})}
        </div>
    );
}

export default function TelaIndicadores() {
const [indicadores, setIndicadores] = useState<Indicador[]>([]);
const [nucleosDoBanco, setNucleosDoBanco] = useState<Nucleo[]>([]);
const [programasDoBanco, setProgramasDoBanco] = useState<Programa[]>([]);

useEffect(() => {
    const carregarIndicadores = async () => {
        const token = localStorage.getItem('access_token');

        if (!token) return;

        try {
            const resposta = await fetch('http://localhost:3000/api/indicadores', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!resposta.ok) {
                throw new Error(`Erro ao carregar indicadores: ${resposta.status}`);
            }

            const dados = await resposta.json();

            const indicadoresReais: Indicador[] = dados.map((item: any) => {
                const registro = item.registros?.[0];

                const unidade = item.unidadeMedida ?? 'Unidade';

                const simbolo =
                    unidade === 'Porcentagem' ? '%' :
                    unidade === 'Toneladas' ? 't' :
                    unidade === 'Quilos' ? 'Kg' :
                    unidade === 'Reais' ? '$' : '';

                return {
                    id: item.id,
                    nome: item.nome,
                    unidade,
                    simbolUni: simbolo,
                    meta: registro?.metaAplicada != null
                        ? String(registro.metaAplicada)
                        : undefined,
                    valAtual: registro?.valorRealizado != null
                        ? String(registro.valorRealizado)
                        : '0',
                    nucleo: item.nucleo ?? undefined,
                    programa: item.programa ?? undefined,
                    status: item.status,
                    aprovado: registro?.statusAprovacao === 'APROVADO',
                };
            });

            setIndicadores(indicadoresReais);
        } catch (erro) {
            console.error('Erro ao carregar indicadores:', erro);
            alert('Não foi possível carregar os indicadores do banco de dados.');
        }
    };

    carregarIndicadores();
        }, []);
        
    useEffect(() => {
        const carregarNucleos = async () => {
            const token = localStorage.getItem('access_token');

            if (!token) return;

            try {
                const resposta = await fetch('http://localhost:3000/api/nucleos', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!resposta.ok) {
                    throw new Error(`Erro ao carregar núcleos: ${resposta.status}`);
                }

                const dados = await resposta.json();

                const nucleosReais: Nucleo[] = dados.map((item: any) => ({
                    id: item.id,
                    nome: item.nome,
                    sigla: item.sigla,
                    descricao: item.descricao ?? '',
                    corBg: 'bg-[#832b62]',
                    corIcone: 'text-white',
                }));

                setNucleosDoBanco(nucleosReais);
            } catch (erro) {
                console.error('Erro ao carregar núcleos:', erro);
                alert('Não foi possível carregar os núcleos do banco de dados.');
            }
        };

        carregarNucleos();
    }, []);

    useEffect(() => {
        const carregarProgramas = async () => {
            const token = localStorage.getItem('access_token');

            if (!token) return;

            try {
                const resposta = await fetch('http://localhost:3000/api/programas', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!resposta.ok) {
                    throw new Error(`Erro ao carregar programas: ${resposta.status}`);
                }

                const dados = await resposta.json();

                const programasReais: Programa[] = dados.map((item: any) => ({
                    id: item.id,
                    nome: item.nome,
                    descricao: item.descricao ?? '',
                    nucleo: item.nucleo
                        ? {
                            id: item.nucleo.id,
                            nome: item.nucleo.nome,
                            sigla: item.nucleo.sigla,
                            descricao: '',
                            corBg: 'bg-[#832b62]',
                            corIcone: 'text-white',
                        }
                        : undefined,
                    dataDeInicio: '',
                    status: 'ATIVO',
                    acoes: [],
                    indicadores: [],
                }));

                setProgramasDoBanco(programasReais);
            } catch (erro) {
                console.error('Erro ao carregar programas:', erro);
                alert('Não foi possível carregar os programas do banco de dados.');
            }
        };

        carregarProgramas();
    }, []);

    const [indicSelecionado, setIndicSelecionado] = useState<Indicador | null>(null);

    const [filtroNucleo, setFiltroNucleo] = useState('');
    const [filtroPrograma, setFiltroPrograma] = useState('');
    const [filtroAprovacao, setFiltroAprovacao] = useState('');

    const NucleosDoUser = nucleosDoBanco;
    const listaNucleosNome = Array.from(new Set(NucleosDoUser.map(i => i.sigla)));

    const programasDoUsuario = programasDoBanco;

    // 2. Aplica o filtro dinâmico do select de núcleos selecionado na tela
    const programasDoNucleo = programasDoUsuario.filter(n => {
        const matchNucleo = filtroNucleo === '' 
            ? true 
            : filtroNucleo === 'Nenhum' 
                ? !n.nucleo 
                : n.nucleo?.sigla === filtroNucleo;
                
        return matchNucleo;
    });

    const listaProgramas = Array.from(new Set(programasDoNucleo.map(i => i.nome)));

    const listagemAprovacao = ['Aprovado', 'Desaprovado']

    // Filtragem
    const indicDoUser = indicadores.filter(n => {
        if (UsuarioAtual.tipo === "ADM") return true;
        if (!n.nucleo) return false;
        
        // Verifica se algum dos núcleos do usuário possui a mesma sigla ou ID do núcleo do indicador
        return UsuarioAtual.nucleos?.some(nuUser => nuUser.sigla === n.nucleo?.sigla);
    });

    const [termoPesquisa, setTermoPesquisa] = useState('');
    const indicPorNome = indicDoUser.filter(n => 
        n.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) || 
        n.unidade.toLowerCase().includes(termoPesquisa.toLowerCase())
    );

    const indicadoresFiltrados = indicPorNome.filter(n => {
        // Se filtroNucleo for vazio, aceita todos. Se for "Nenhum", filtra os que não têm núcleo. Senão filtra pelo nome.
        const matchNucleo = filtroNucleo === '' 
            ? true 
            : filtroNucleo === 'Nenhum' 
                ? !n.nucleo 
                : n.nucleo?.sigla === filtroNucleo;
                
        const matchPrograma = filtroPrograma === '' 
            ? true 
            : filtroPrograma === 'Nenhum' 
                ? !n.programa 
                : n.programa?.nome === filtroPrograma;

        const matchAprov = filtroAprovacao === ''
            ? true
            : filtroAprovacao === 'Aprovado'
                ? n.aprovado : !n.aprovado
        //const matchPrograma = filtroPrograma ? n.programa === filtroPrograma : true;
        return matchNucleo && matchPrograma && matchAprov;
    });

    const [formNome, setNomeForm] = useState('');
    const [formUnidade, setUnidadeForm] = useState('');
    const [formNucleoId, setFormNucleoId] = useState<string>('');
    const [formProgramId, setProgramId] = useState<string>('');
    const [formMeta, setMetaForm] = useState('');
    const [formValor, setValorForm] = useState('');
    const [formAno, setFormAno] = useState(String(new Date().getFullYear()));
    const [formTrimestre, setFormTrimestre] = useState('T4');
    const [formStatus, setStatusForm] = useState('');
    const [formAprovacao, setAprovacaoForm] = useState(false);
    const [formDesaprovMotivo, setMotivo] = useState('');

    function getUnitSimb()
    {
        switch(formUnidade)
        {
            case "Porcentagem":
                return '%';
            case "Toneladas":
                return 't';
            case "Quilos":
                return 'Kg';
            case "Reais":
                return '$';
            default:
                return '';
        }
    }

    // Janelas popup
    
    const [modalNovoAberto, setModalNovoAberto] = useState(false);
    const abrirCriarModal = () => {
        setNomeForm('');
        setUnidadeForm('');
        setFormNucleoId('');
        setProgramId('');
        setStatusForm('ativo');
        setModalNovoAberto(true);
    };

const handleCriarIndic = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('access_token');

    if (!token) {
        alert('Sua sessão expirou. Faça login novamente.');
        return;
    }

    const nome = formNome.trim();

    if (!nome) {
        alert('Informe o nome do indicador.');
        return;
    }

    const nucleoSelecionado = formNucleoId
        ? NucleosDoUser.find(n => n.id === formNucleoId)
        : undefined;

    const programSelecionado = formProgramId
        ? programasDoBanco.find(n => n.id === formProgramId)
        : undefined;

    const tipoDado =
        formUnidade === 'Porcentagem'
            ? 'PERCENTUAL'
            : formUnidade === 'Reais'
                ? 'MOEDA'
                : 'NUMERICO';

    const dadosIndicador = {
        nome,
        unidadeMedida: formUnidade || 'Unidade',
        escopo: nucleoSelecionado ? 'NUCLEO' : 'INSTITUCIONAL',
        tipoDado,
        nucleoId: nucleoSelecionado?.id || null,
        programaId: programSelecionado?.id || null,
    };

    try {
        const resposta = await fetch('http://localhost:3000/api/indicadores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dadosIndicador),
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.message || 'Não foi possível cadastrar o indicador.'
            );
        }

        const novo: Indicador = {
            id: resultado.id,
            nome: resultado.nome,
            unidade: resultado.unidadeMedida || 'Unidade',
            simbolUni: getUnitSimb(),
            nucleo: resultado.nucleo
                ? {
                    id: resultado.nucleo.id,
                    nome: resultado.nucleo.nome,
                    sigla: resultado.nucleo.sigla,
                    descricao: resultado.nucleo.descricao || '',
                    corBg: 'bg-[#832b62]',
                    corIcone: 'text-white',
                    }
                : undefined,
                programa: resultado.programa
                ? {
                    ...programSelecionado,
                    id: resultado.programa.id,
                    nome: resultado.programa.nome,
                    } as Programa
                : undefined,
            valAtual: '0',
            status: resultado.status || 'ATIVO',
            aprovado: false,
        };

        setIndicadores(prev => [...prev, novo]);
        setModalNovoAberto(false);
        setNomeForm('');
        setUnidadeForm('');
        setFormNucleoId('');
        setProgramId('');

        alert('Indicador cadastrado com sucesso!');
    } catch (erro) {
        console.error('Erro ao cadastrar indicador:', erro);
        alert(
            erro instanceof Error
                ? erro.message
                : 'Erro ao cadastrar indicador.'
        );
    }
};


    const [modalInserindoValor, inserindoValor] = useState(false);
    const abrirValModal = (indicador: Indicador) => {
        setIndicSelecionado(indicador);
        setValorForm(indicador.valAtual);
        setFormAno(String(new Date().getFullYear()));
        setFormTrimestre('T4');
        inserindoValor(true);
    };

    const InserirValor = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!indicSelecionado) return;

        const token = localStorage.getItem('access_token');

        if (!token) {
            alert('Sua sessão expirou. Faça login novamente.');
            return;
        }

        try {
            const resposta = await fetch(
                `http://localhost:3000/api/indicadores/${indicSelecionado.id}/registros`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ano: Number(formAno),
                        trimestre: formTrimestre,
                        valorRealizado: Number(formValor),
                    }),
                }
            );

            if (!resposta.ok) {
                const erro = await resposta.json();
                throw new Error(erro.message || 'Não foi possível salvar o valor.');
            }

            setIndicadores(indicadores.map(n =>
                n.id === indicSelecionado.id
                    ? { ...n, valAtual: formValor }
                    : n
            ));

            inserindoValor(false);
            alert('Valor salvo com sucesso!');

        } catch (erro) {
            console.error('Erro ao salvar valor:', erro);
            alert(
                erro instanceof Error
                    ? erro.message
                    : 'Erro ao salvar o valor.'
            );
        }
    };
        
    const [modalEditAberto, setEditAberto] = useState(false);
    const abrirEditarModal = (indicador: Indicador) => {
        setIndicSelecionado(indicador);
        setNomeForm(indicador.nome);
        setUnidadeForm(indicador.unidade);
        setFormNucleoId(indicador.nucleo ? indicador.nucleo.id : '');
        setProgramId(indicador.programa ? indicador.programa.id : "");
        setMetaForm(indicador.meta != null ? indicador.meta : "");
        setStatusForm(indicador.status);
        setEditAberto(true);
    };

    const handleSalvarEdicao = (e: React.FormEvent) => {
        e.preventDefault();
        if (!indicSelecionado) return;
        
        let unitSimbol = getUnitSimb();
        const nucleoSelecionado = formNucleoId ? NucleosDoUser.find(n => n.id === formNucleoId) : undefined;
        const programSelecionado = formProgramId ? programasDoBanco.find(n => n.id === formProgramId) : undefined;

        setIndicadores(indicadores.map(n => n.id === indicSelecionado.id ? {
        ...n,
        nome: formNome,
        unidade: formUnidade,
        simbolUni: unitSimbol,
        nucleo: nucleoSelecionado,
        programa: programSelecionado,
        meta: formMeta || undefined,
        status: formStatus
        } : n));
        setEditAberto(false);
    };

    const [modalDeletando, setDeletando] = useState(false);
    const abrirDeletarModal = (indicador: Indicador) => {
        setIndicSelecionado(indicador);
        setDeletando(true);
    }

    const deletarIndic = () => {
        if (!indicSelecionado) return;
        setIndicadores(indicadores.filter(n => n.id !== indicSelecionado.id));
        setDeletando(false);
    };

    const [modalAprovacao, setModelAprov] = useState(false);
    const abrirAprovacaoModal = (indicador: Indicador) => {
        setIndicSelecionado(indicador);
        setAprovacaoForm(indicador.aprovado);
        setMotivo('');
        setModelAprov(true);
    }

    const handleAprovacao = (e: React.FormEvent) => {
        e.preventDefault();
        if (!indicSelecionado) return;

        setIndicadores(indicadores.map(n => n.id === indicSelecionado.id ? {
        ...n,
        aprovado: formAprovacao,
        } : n));

        formAprovacao ? "" : alert("Voce desaprovou por motivo: "+formDesaprovMotivo)

        setModelAprov(false);
    };

    const totalIndicadores = indicadoresFiltrados.length;

    const indicadoresComMeta = indicadoresFiltrados.filter(n => {
        const metaNum = parseFloat(n.meta || '0');
        return !isNaN(metaNum) && metaNum > 0;
    });


const progressoGeral = React.useMemo(() => {
    if (indicadoresComMeta.length === 0) return 0;

    const somaPercentuais = indicadoresComMeta.reduce((acc, indicador) => {
        const realizado = Number(indicador.valAtual) || 0;
        const meta = Number(indicador.meta);

        if (!Number.isFinite(meta) || meta <= 0) return acc;

        const pct = Math.min((realizado / meta) * 100, 100);

        return acc + pct;
    }, 0);

    return Math.round(somaPercentuais / indicadoresComMeta.length);
}, [indicadoresComMeta]);


    const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        const arquivo = input.files?.[0];
        if (!arquivo) return;

        if (!/\.(csv|xlsx|xls)$/i.test(arquivo.name)) {
            alert("Selecione um arquivo CSV, XLSX ou XLS.");
            input.value = "";
            return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Sua sessão não foi encontrada. Entre novamente no sistema.");
            input.value = "";
            return;
        }

        const dados = new FormData();
        dados.append("arquivo", arquivo);

        try {
            const resposta = await fetch("http://localhost:3000/api/importacoes/csv", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: dados
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.message || "Não foi possível importar o arquivo.");
            }

            const resumo = [
                `Importação finalizada: ${resultado.status}`,
                `Linhas válidas importadas: ${resultado.linhasOk ?? 0}`,
                `Total de linhas: ${resultado.totalLinhas ?? 0}`
            ];

            if (Array.isArray(resultado.erros) && resultado.erros.length > 0) {
                resumo.push(
                    "",
                    "Erros encontrados:",
                    ...resultado.erros.slice(0, 10).map(
                        (erro: { linha?: number; mensagem?: string }) =>
                            `Linha ${erro.linha ?? "?"}: ${erro.mensagem ?? "Erro não especificado"}`
                    )
                );
                if (resultado.erros.length > 10) {
                    resumo.push(`... e mais ${resultado.erros.length - 10} erro(s).`);
                }
            }

            alert(resumo.join("\n"));
        } catch (erro) {
            alert(erro instanceof Error ? erro.message : "Erro ao importar o arquivo.");
        } finally {
            input.value = "";
        }
    };

    return(
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">

            <NavBar />

            {/*================ CONTEUDO PRINCIPAL =================*/}
            <main className="flex-1 p-6 md:p-8 h-full overflow-y-auto">
                
            <div className="flex flex-1 flex-col gap-[30px] items-center pt-[30px] w-full">
                
                {/* Header */}
                <div className="flex flex-col gap-[30px] items-center w-full" data-name="Header">
                    <div className="flex items-center justify-center px-[20px] w-full" data-name="Titulo">
                        <p className="text-3xl font-['Google_Sans_Flex:Regular',sans-serif] font-normal relative shrink-0 text-[#a13680] w-full">
                            Indicadores
                        </p>
                    </div>

                    {/* Resumos */}
                    <div className="flex gap-[30px] items-start justify-center px-[40px] w-full" data-name="Resumos">
                        <TotalProgresso progresso={progressoGeral} />
                        <TotalIndicadores valor={totalIndicadores} />
                        <TotalParticipantes />
                    </div>

                </div>

                <div className="flex flex-col gap-[20px] items-center py-[10px] w-full">
                    {/*Control*/}
                    <div className="flex gap-[16px] items-center justify-center flex-wrap w-full">
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

                        <CustomDropdown 
                            icon={Svg.UsersMais}
                            label="Núcleos" 
                            valor={filtroNucleo} 
                            onChange={setFiltroNucleo} 
                            opcoes={listaNucleosNome}
                        />
                        
                        <CustomDropdown 
                            icon={Svg.UsersMais}
                            label="Programas" 
                            valor={filtroPrograma} 
                            onChange={setFiltroPrograma} 
                            opcoes={listaProgramas} 
                        />
                        
                        <CustomDropdown 
                            icon={Svg.UsersMais}
                            label="Aprovação" 
                            valor={filtroAprovacao} 
                            onChange={setFiltroAprovacao} 
                            opcoes={listagemAprovacao} 
                        />

                        {UsuarioAtual.tipo == "ADM" ?
                            <>
                            <BtnCriar txt="Novo Indicador" acao={abrirCriarModal} />
                            
                            {/* Botão importar */}
                            <div className="bg-transparent border-2 border-[#3b142f] flex h-[48px] items-center justify-between relative bg-slate-200 cursor-pointer px-[16px] py-[4px] rounded-[9px] shrink-0 w-[180px]">
                                <BtnImportIco ico="block size-full" id="btnImportar"/>
                                <div className="font-normal text-[#3d3d3d] text-[16px] whitespace-nowrap">
                                    Importar CSV
                                </div>
                                <input 
                                    type="file"
                                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"                                    className="absolute inset-0 opacity-0 cursor-pointer size-full z-10"
                                    title="Importar CSV"
                                    onChange={handleCSVImport}
                                />
                            </div>

                            {/* Botão exportar 
                            (deixei comentado, pelo q me lembre n vai precisar exportar CSV e ainda mais diretamente dessa tela)*/}
                            {/*
                            <div className="bg-transparent border-2 border-[#3b142f] flex h-[48px] items-center justify-between px-[16px] py-[4px] rounded-[9px] shrink-0 w-[180px]">
                                <BtnImportIco ico="block size-full rotate-180" id="btnExportar"/>
                                <p className="font-normal text-[#3d3d3d] text-[16px] whitespace-nowrap">
                                    Exportar CSV
                                </p>
                            </div>
                            */}
                            </> : ""
                        }

                    </div>

                    {/*ListaIndicadores*/}
                    <div className="flex flex-col gap-[8px] items-center px-[10px] py-[10px] w-full">
                        <Top />
                        <Lista leList={indicadoresFiltrados}
                                editIndic={abrirEditarModal}
                                setIndicVal={abrirValModal}
                                delIndic={abrirDeletarModal}
                                aprovIndic={abrirAprovacaoModal} />
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
            
            { /* ==================== TELAS POPUP ======================== */}
            {/* criação */}
            {modalNovoAberto && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Novo Indicador</h2>

                    <form onSubmit={handleCriarIndic} className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nome</label>
                            <input 
                            type="text" 
                            placeholder="Insira um nome..." 
                            value={formNome}
                            onChange={(e) => setNomeForm(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                            <select 
                            value={formUnidade}
                            onChange={(e) => setUnidadeForm(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            >
                                <option value="Unidade">Unidade</option>
                                <option value="Porcentagem">Porcentagem (%)</option>
                                <option value="Toneladas">Toneladas (t)</option>
                                <option value="Quilos">Quilos (Kg)</option>
                                <option value="Reais">Reais ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Núcleo</label>
                            <select 
                            value={formNucleoId}
                            onChange={(e) => setFormNucleoId(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            >
                                <option value="">Sem núcleo</option>
                                {NucleosDoUser.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.sigla}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Programa</label>
                            <select 
                            value={formProgramId}
                            onChange={(e) => setProgramId(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            >
                                <option value="">Sem programa</option>
                                {programasDoBanco.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.nome}</option>
                                ))}
                            </select>
                        </div>
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
                        <span>Criar</span>
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            )}

            {/* edicao por diretor de nucleo (so o realizado) */}
            {modalInserindoValor && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Definindo valor</h2>

                    <form onSubmit={InserirValor} className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Alterando valor {indicSelecionado?.simbolUni ? "(" + indicSelecionado.simbolUni + ")" : ""}
                            </label>
                            <input
                                type="number"
                                min="0"
                                placeholder="Insira um valor..."
                                value={formValor}
                                onChange={(e) => setValorForm(e.target.value)}
                                className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Ano
                            </label>
                            <input
                                type="number"
                                min="2000"
                                max="2100"
                                value={formAno}
                                onChange={(e) => setFormAno(e.target.value)}
                                className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Trimestre
                            </label>
                            <select
                                value={formTrimestre}
                                onChange={(e) => setFormTrimestre(e.target.value)}
                                className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                                required
                            >
                                <option value="Q1">1º trimestre (Q1)</option>
                                <option value="Q2">2º trimestre (Q2)</option>
                                <option value="Q3">3º trimestre (Q3)</option>
                                <option value="Q4">4º trimestre (Q4)</option>
                            </select>
                        </div>
                    </div>


                    <div className="flex items-center gap-3 pt-4">
                        <button 
                        type="button" 
                        onClick={() => inserindoValor(false)}
                        className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                        Cancelar
                        </button>
                        <button 
                        type="submit" 
                        className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                        <span>Confirmar</span>
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            )}

            {/* edicao por admin */}
            {modalEditAberto && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Editando Indicador</h2>

                    <form onSubmit={handleSalvarEdicao} className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nome</label>
                            <input 
                            type="text" 
                            placeholder="Insira um nome..." 
                            value={formNome}
                            onChange={(e) => setNomeForm(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                            <select 
                            value={formUnidade}
                            onChange={(e) => setUnidadeForm(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            >
                                <option value="Unidade">Unidade</option>
                                <option value="Porcentagem">Porcentagem (%)</option>
                                <option value="Toneladas">Toneladas (t)</option>
                                <option value="Quilos">Quilos (Kg)</option>
                                <option value="Reais">Reais ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Núcleo</label>
                            <select 
                            value={formNucleoId}
                            onChange={(e) => setFormNucleoId(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            >
                                <option value="">Sem núcleo</option>
                                {NucleosDoUser.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.sigla}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Programa</label>
                            <select 
                            value={formProgramId}
                            onChange={(e) => setProgramId(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            >
                                <option value="">Sem programa</option>
                                {programasDoBanco.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Meta</label>
                            <input 
                            type="number"
                            min="0" 
                            placeholder="Defina uma meta..." 
                            value={formMeta}
                            onChange={(e) => setMetaForm(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            />
                        </div>
                    </div>


                    <div className="flex items-center gap-3 pt-4">
                        <button 
                        type="button" 
                        onClick={() => setEditAberto(false)}
                        className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                        Cancelar
                        </button>
                        <button 
                        type="submit" 
                        className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                        <span>Confirmar</span>
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            )}

            {/* deletamento */}
            {modalDeletando && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Atenção!</h2>
                    <p className="text-sm text-slate-600 mb-1">
                    Tem certeza que deseja <span className="font-bold text-slate-800">deletar</span> esse Indicador permanentemente?
                    </p>
                    <p className="text-xs text-slate-500 mb-6">
                    Esta ação <span className="font-bold text-slate-800">não pode ser desfeita</span>.
                    </p>

                    <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setDeletando(false)}
                        className="flex-1 py-2.5 rounded-xl bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={deletarIndic}
                        className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        Deletar
                    </button>
                    </div>
                </div>
            </div>
            )}
            
            {/* aprovacao */}
            {modalAprovacao && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Definir aprovação</h2>

                    <form onSubmit={handleAprovacao} className="space-y-4">
                    <div className="flex flex-col gap-9">
                        <div>
                            <label className="flex gap-5 block text-lg-20 font-bold">
                                Definir como aprovado para publicação
                                <input
                                type="checkbox"
                                checked={formAprovacao}
                                onChange={(e) => setAprovacaoForm(e.target.checked)}
                                className="w-auto border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-0 focus:outline-none"
                                />
                            </label>
                        </div>

                        {
                            !formAprovacao ?
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de disaprovação</label>
                                <input 
                                type="text"
                                placeholder="Insira um valor..." 
                                required
                                value={formDesaprovMotivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                                />
                            </div> 
                            : ""
                        }
                    </div>


                    <div className="flex items-center gap-3 pt-4">
                        <button 
                        type="button" 
                        onClick={() => setModelAprov(false)}
                        className="flex-1 py-2.5 rounded-full border border-slate-800 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                        Cancelar
                        </button>
                        <button 
                        type="submit" 
                        className="flex-1 py-2.5 rounded-full bg-[#3a182d] text-white font-medium text-xs hover:bg-[#2a1120] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                        <span>Confirmar</span>
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            )}

        </div>
    );
}