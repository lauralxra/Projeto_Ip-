import { IndicadoresCadastrados, type Indicador } from "./indicadores";
import { programasCadastrados } from "./programas";
import { UsuariosCadastrados } from "./usuarios";

export interface Trimestre {
    id: string;
    periodo: string;
    quantiaUsers: number;
    quantiaProgramas: number;
    quantiaIndicadores: number;
}

export const TrimestreAtual: Trimestre = {
    id: '2390',
    periodo: '2026.4',
    quantiaUsers: UsuariosCadastrados.length,
    quantiaIndicadores: IndicadoresCadastrados.length,
    quantiaProgramas: programasCadastrados.length
}

export const TrimestresPassados: Map<Trimestre, Indicador[]> = new Map<Trimestre, Indicador[]>(
    [
        [TrimestreAtual, IndicadoresCadastrados],
        [
            {
                id: '2389',
                periodo: '2026.3',
                quantiaIndicadores: 2,
                quantiaProgramas: 9,
                quantiaUsers: 6
            },
            [
                {
                    id: '0',
                    nome: 'Número de Pessoas Atendidas',
                    unidade: 'Unidade',
                    valAtual: '950',
                    nucleo:
                    {
                        id: '1',
                        nome: 'Núcleo de Relações Institucionais',
                        sigla: 'NURI',
                        descricao: 'Articulação de parcerias e relações institucionais',
                        corBg: 'bg-[#6b6e77]',
                        corIcone: 'text-white',
                        logoTexto: 'NURI'
                    },
                    status: 'ativo',
                    aprovado: true
                }
            ]
        ],
        [
            {
                id: '2388',
                periodo: '2026.2',
                quantiaIndicadores: 4,
                quantiaProgramas: 5,
                quantiaUsers: 6
            },
            [
                {
                    id: '0',
                    nome: 'Número de Pessoas Atendidas',
                    unidade: 'Unidade',
                    valAtual: '720',
                    nucleo:
                    {
                        id: '1',
                        nome: 'Núcleo de Relações Institucionais',
                        sigla: 'NURI',
                        descricao: 'Articulação de parcerias e relações institucionais',
                        corBg: 'bg-[#6b6e77]',
                        corIcone: 'text-white',
                        logoTexto: 'NURI'
                    },
                    status: 'ativo',
                    aprovado: true
                }
            ]
        ],
        [
            {
                id: '2387',
                periodo: '2026.1',
                quantiaIndicadores: 4,
                quantiaProgramas: 5,
                quantiaUsers: 6
            },
            [
                {
                    id: '0',
                    nome: 'Número de Pessoas Atendidas',
                    unidade: 'Unidade',
                    valAtual: '780',
                    nucleo:
                    {
                        id: '1',
                        nome: 'Núcleo de Relações Institucionais',
                        sigla: 'NURI',
                        descricao: 'Articulação de parcerias e relações institucionais',
                        corBg: 'bg-[#6b6e77]',
                        corIcone: 'text-white',
                        logoTexto: 'NURI'
                    },
                    status: 'ativo',
                    aprovado: true
                }
            ]
        ],
        [
            {
                id: '2386',
                periodo: '2025.4',
                quantiaIndicadores: 4,
                quantiaProgramas: 5,
                quantiaUsers: 6
            },
            [
                {
                    id: '0',
                    nome: 'Número de Pessoas Atendidas',
                    unidade: 'Unidade',
                    valAtual: '650',
                    nucleo:
                    {
                        id: '1',
                        nome: 'Núcleo de Relações Institucionais',
                        sigla: 'NURI',
                        descricao: 'Articulação de parcerias e relações institucionais',
                        corBg: 'bg-[#6b6e77]',
                        corIcone: 'text-white',
                        logoTexto: 'NURI'
                    },
                    status: 'ativo',
                    aprovado: true
                }
            ]
        ],
        [
            {
                id: '2385',
                periodo: '2025.3',
                quantiaIndicadores: 4,
                quantiaProgramas: 5,
                quantiaUsers: 6
            },
            [
                {
                    id: '0',
                    nome: 'Número de Pessoas Atendidas',
                    unidade: 'Unidade',
                    valAtual: '500',
                    nucleo:
                    {
                        id: '1',
                        nome: 'Núcleo de Relações Institucionais',
                        sigla: 'NURI',
                        descricao: 'Articulação de parcerias e relações institucionais',
                        corBg: 'bg-[#6b6e77]',
                        corIcone: 'text-white',
                        logoTexto: 'NURI'
                    },
                    status: 'ativo',
                    aprovado: true
                }
            ]
        ]
    ]
)