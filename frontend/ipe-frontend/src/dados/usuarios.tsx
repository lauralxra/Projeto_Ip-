import type { Nucleo } from './nucleos';
import { NucleosCadastrados } from './nucleos';

export type TipoDeConta = 'EC' | 'EG' | 'DN';
export const TipoDeConta = {
    EC: 'EC',
    EG: 'EG',
    DN: 'DN',
} as const;

export interface Usuario {
    id: string;
    nome: string;
    imagem?: string;
    tipo: TipoDeConta;
    nucleos: Nucleo[];
    status: number;
}

export const UsuariosCadastrados: Usuario[] = [
    {
        id: '646253',
        nome: 'Carla Maria da Silva',
        tipo: TipoDeConta.DN,
        nucleos: [NucleosCadastrados[0], NucleosCadastrados[1]],
        status: 1,
        imagem: 'unsplash_IF9TK5Uy-KI.png'
    },
    {
        id: '4873294',
        nome: 'Caíque Matias de Barros',
        tipo: TipoDeConta.EC,
        nucleos: [],
        status: 1,
        imagem: 'unsplash_KIPqvvTOC1s.png'
    },
    {
        id: '8923743',
        nome: 'Leticia Soares de Lima',
        tipo: TipoDeConta.DN,
        nucleos: [NucleosCadastrados[2]],
        status: 1
    },
    {
        id: '092384',
        nome: 'Lucia Monte Alburquerque Pereira',
        tipo: TipoDeConta.DN,
        nucleos: [NucleosCadastrados[1]],
        status: 1
    },
    {
        id: '312982',
        nome: 'Lucas Pereira Santos',
        tipo: TipoDeConta.EG,
        nucleos: [NucleosCadastrados[0], NucleosCadastrados[3]],
        status: 0
    },
    {
        id: '29407',
        nome: 'Luiz Moura da Silva',
        tipo: TipoDeConta.EC,
        nucleos: [],
        status: 1
    },
    {
        id: '692046',
        nome: 'Zé',
        tipo: TipoDeConta.EG,
        nucleos: [NucleosCadastrados[0], NucleosCadastrados[1], NucleosCadastrados[2], NucleosCadastrados[3]],
        status: 1
    }
];