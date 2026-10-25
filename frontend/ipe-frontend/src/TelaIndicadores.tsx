import React, { useState } from 'react';
import { Svg } from "./config/assets";
import { NavBar } from './NavBar';
import { User } from './UserBar';
import { BtnCriar } from './BtnCriar';
import { CustomDropdown } from './CustomDropdown';

import type { Nucleo } from './dados/nucleos';
import { NucleosCadastrados } from './dados/nucleos';

interface Indicador {
  id: string;
  nome: string;
  unidade: string;
  simbolUni?: string;
  meta?: string;
  valAtual: string;
  nucleo?: Nucleo;
  programa?: string;
}

const dadosIniciais: Indicador[] = [
  {
    id: '1',
    nome: 'Taxa de reciclagem de resíduos',
    unidade: 'Porcentagem',
    simbolUni: '%',
    meta: '100',
    valAtual: '65',
    nucleo: NucleosCadastrados[0],
  },
  {
    id: '2',
    nome: 'Redução de emissão de Co2',
    unidade: 'Toneladas',
    simbolUni: 't',
    meta: '50',
    valAtual: '12',
    nucleo: NucleosCadastrados[2],
  },
  {
    id: '3',
    nome: 'Pessoas capacitadas',
    unidade: 'Unidade',
    meta: '10',
    valAtual: '13',
    nucleo: NucleosCadastrados[2],
  },
];

function TotalProgresso({ progresso }: { progresso: number }) {
    // Cálculo matemático para preencher o círculo SVG proporcionalmente
    // O raio do círculo é 82.5, logo a circunferência aproximada é 2 * pi * 82.5 ≈ 518.36
    const raio = 82.5;
    const circunferencia = 2 * Math.PI * raio;
    const deslocamento = circunferencia - (circunferencia * progresso) / 100;
    
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
                {progresso}%
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

function Lista( { leList, editIndic, setIndicVal, delIndic }: { leList:Indicador[],
                                                        editIndic:(arg0: Indicador) => void,
                                                        setIndicVal:(indic: Indicador) => void 
                                                        delIndic:(indic: Indicador) => void }) {
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

                        {/* Realizado */}
                        <button onClick={() => setIndicVal(indicador)} className="flex flex-1 gap-[16px] items-center cursor-pointer">
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
                        
                        {/* Container barra */}
                        <div className="flex items-center flex-1">
                            <div className="bg-[#c2c2c2] flex flex-col h-[8px] items-start rounded-[100px] w-[90px] overflow-hidden">
                                <div className="bg-gradient-to-r from-[#3b142f] to-[#77275e] h-full rounded-[100px] w-[60%]" 
                                style={{ width: `${progressoPercent}%` }} />
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-1 gap-[12px] items-center">
                            <button onClick={() => editIndic(indicador)} className="size-[24px] cursor-pointer">
                                <svg className="block size-full" fill="none" viewBox="0 0 39 39">
                                  <path d={Svg.p36224900} fill="#3C3B3B" />
                                </svg>
                            </button>
                            
                            <a className="size-[24px]" href='/dashboard'>
                              <div className="size-full">
                                <svg className="block size-full" fill="none" viewBox="0 0 32.5 32.5001">
                                  <path d={Svg.p19cd0a80} fill="#3C3B3B" />
                                </svg>
                              </div>
                            </a>

                            <button onClick={() => delIndic(indicador)} className="size-[24px] cursor-pointer">
                                <svg className="block size-full" fill="none" viewBox="0 0 31.6875 36.5625">
                                  <path d={Svg.p38953980} fill="#3C3B3B" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )})}
        </div>
    );
}

export default function TelaIndicadores() {
    const [indicadores, setIndicadores] = useState<Indicador[]>(dadosIniciais);
    const [indicSelecionado, setIndicSelecionado] = useState<Indicador | null>(null);

    const [filtroNucleo, setFiltroNucleo] = useState('');
    const [filtroPrograma, setFiltroPrograma] = useState('');

    const listaNucleosNome = Array.from(new Set(NucleosCadastrados.map(i => i.sigla)));
    const listaProgramas = Array.from(new Set(indicadores.map(i => i.programa).filter(Boolean))) as string[];

    // Filtragem combinada por Núcleo e Programa
    const indicadoresFiltrados = indicadores.filter(n => {
        // Se filtroNucleo for vazio, aceita todos. Se for "Nenhum", filtra os que não têm núcleo. Senão filtra pelo nome.
        const matchNucleo = filtroNucleo === '' 
            ? true 
            : filtroNucleo === 'Nenhum' 
                ? !n.nucleo 
                : n.nucleo?.sigla === filtroNucleo;
        const matchPrograma = filtroPrograma ? n.programa === filtroPrograma : true;
        return matchNucleo && matchPrograma;
    });
    
    // Janelas popup
    const [modalNovoAberto, setModalNovoAberto] = useState(false);
    const [modalInserindoValor, inserindoValor] = useState(false);
    const [modalEditAberto, setEditAberto] = useState(false);
    const [modalDeletando, setDeletando] = useState(false);
    
    const [formNome, setNomeForm] = useState('');
    const [formUnidade, setUnidadeForm] = useState('');
    const [formNucleoId, setFormNucleoId] = useState<string>('');
    const [formProgram, setProgramForm] = useState('');
    const [formMeta, setMetaForm] = useState('');
    const [formValor, setValorForm] = useState('');

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
    
    const abrirCriarModal = () => {
        setNomeForm('');
        setUnidadeForm('');
        setFormNucleoId('');
        setProgramForm('');
        setModalNovoAberto(true);
    };

    const handleCriarIndic = (e: React.FormEvent) => {
        e.preventDefault();
        
        let unitSimbol = getUnitSimb();
        const nucleoSelecionado = formNucleoId ? NucleosCadastrados.find(n => n.id === formNucleoId) : undefined;
        
        const novo: Indicador = {
            id: Date.now().toString(),
            nome: formNome || 'Novo Indicador',
            unidade: formUnidade || 'Unidade',
            simbolUni: unitSimbol,
            nucleo: nucleoSelecionado,
            programa: formProgram,
            valAtual: '0'
        };
        setIndicadores([...indicadores, novo]);
        setModalNovoAberto(false);
    };

    const abrirValModal = (indicador: Indicador) => {
        setIndicSelecionado(indicador);
        setValorForm(indicador.valAtual);
        inserindoValor(true);
    }

    const InserirValor = (e: React.FormEvent) => {
        e.preventDefault();
        if (!indicSelecionado) return;

        setIndicadores(indicadores.map(n => n.id === indicSelecionado.id ? {
        ...n,
        valAtual: formValor,
        } : n));
        inserindoValor(false);
    };
    
    const abrirEditarModal = (indicador: Indicador) => {
        setIndicSelecionado(indicador);
        setNomeForm(indicador.nome);
        setUnidadeForm(indicador.unidade);
        setFormNucleoId(indicador.nucleo ? indicador.nucleo.id : '');
        setProgramForm(indicador.programa != null ? indicador.programa : "");
        setMetaForm(indicador.meta != null ? indicador.meta : "");
        setEditAberto(true);
    };

    const handleSalvarEdicao = (e: React.FormEvent) => {
        e.preventDefault();
        if (!indicSelecionado) return;
        
        let unitSimbol = getUnitSimb();
        const nucleoSelecionado = formNucleoId ? NucleosCadastrados.find(n => n.id === formNucleoId) : undefined;

        setIndicadores(indicadores.map(n => n.id === indicSelecionado.id ? {
        ...n,
        nome: formNome,
        unidade: formUnidade,
        simbolUni: unitSimbol,
        nucleo: nucleoSelecionado,
        programa: formProgram,
        meta: formMeta,
        } : n));
        setEditAberto(false);
    };

    const abrirDeletarModal = (indicador: Indicador) => {
        setIndicSelecionado(indicador);
        setDeletando(true);
    }

    const deletarIndic = () => {
        if (!indicSelecionado) return;
        setIndicadores(indicadores.filter(n => n.id !== indicSelecionado.id));
        setDeletando(false);
    };

    const totalIndicadores = indicadoresFiltrados.length;

    const indicadoresComMeta = indicadoresFiltrados.filter(n => {
        const metaNum = parseFloat(n.meta || '0');
        return !isNaN(metaNum) && metaNum > 0;
    });

    const progressoGeral = React.useMemo(() => {        
        if (totalIndicadores === 0) return 0;
        const somaPercentuais = indicadoresComMeta.reduce((acc, indicador) => {
            const realizado = parseFloat(indicador.valAtual) || 0;
            const meta = parseFloat(indicador.meta || '0');
            
            if (meta <= 0) return 100;
            
            const pct = Math.min((realizado / meta) * 100, 100);
            return acc + pct;
        }, 0);

        return Math.round(somaPercentuais / indicadoresComMeta.length);
    }, [indicadoresComMeta]);

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

                        {/* Botão importar */}
                        <div className="bg-transparent border-2 border-[#3b142f] flex h-[48px] items-center justify-between px-[16px] py-[4px] rounded-[9px] shrink-0 w-[180px]">
                            <BtnImportIco ico="block size-full" id="btnImportar"/>
                            <p className="font-normal text-[#3d3d3d] text-[16px] whitespace-nowrap">
                                Importar CSV
                            </p>
                        </div>

                        {/* Botão exportar */}
                        {/*
                        <div className="bg-transparent border-2 border-[#3b142f] flex h-[48px] items-center justify-between px-[16px] py-[4px] rounded-[9px] shrink-0 w-[180px]">
                            <BtnImportIco ico="block size-full rotate-180" id="btnExportar"/>
                            <p className="font-normal text-[#3d3d3d] text-[16px] whitespace-nowrap">
                                Exportar CSV
                            </p>
                        </div>
                        */}

                        <BtnCriar txt="Novo Indicador" acao={abrirCriarModal} />
                    </div>

                    {/*ListaIndicadores*/}
                    <div className="flex flex-col gap-[8px] items-center px-[10px] py-[10px] w-full">
                        <Top />
                        <Lista leList={indicadoresFiltrados}
                                editIndic={abrirEditarModal}
                                setIndicVal={abrirValModal}
                                delIndic={abrirDeletarModal} />
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
                                {NucleosCadastrados.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.sigla}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Programa</label>
                            <input 
                            type="text" 
                            placeholder="Programa correspondentee..." 
                            value={formProgram}
                            onChange={(e) => setProgramForm(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            />
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
                            <label className="block text-xs font-bold text-slate-700 mb-1">Alterando valor</label>
                            <input 
                            type="number"
                            min="0" 
                            placeholder="Insira um valor..." 
                            value={formValor}
                            onChange={(e) => setValorForm(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            />
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
                                {NucleosCadastrados.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.sigla}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Programa</label>
                            <input 
                            type="text" 
                            placeholder="Programa correspondente..." 
                            value={formProgram}
                            onChange={(e) => setProgramForm(e.target.value)}
                            className="w-full bg-slate-200/70 border-0 rounded-xl px-3 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-[#832b62] focus:outline-none"
                            />
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

        </div>
    );
}