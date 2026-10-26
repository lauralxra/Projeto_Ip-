import type { Nucleo } from './nucleos';
import { NucleosCadastrados } from './nucleos';

export type TipoDeConta = 'EC' | 'EG' | 'DN' | 'ADM';
export const TipoDeConta = {
    EC: 'EC',
    EG: 'EG',
    DN: 'DN',
    ADM: 'ADM'
} as const;

export interface Usuario {
    id: string;
    nome: string;
    email: string;
    senha: string;
    imagem?: string;
    tipo: TipoDeConta;
    nucleos: Nucleo[];
    status: number;
}

export const UsuariosCadastrados: Usuario[] = [
    {
        id: '0',
        nome: 'Carla Maria da Silva',
        email: 'carla.maria@ufrpe.com',
        senha: '1234@senha',
        tipo: TipoDeConta.DN,
        nucleos: [NucleosCadastrados[0], NucleosCadastrados[1]],
        status: 1,
        imagem: 'unsplash_IF9TK5Uy-KI.png'
    },
    {
        id: '1',
        nome: 'Caíque Matias de Barros',
        email: 'caique.matias@ufrpe.com',
        senha: '1234@senha',
        tipo: TipoDeConta.EC,
        nucleos: [],
        status: 1,
        imagem: 'unsplash_KIPqvvTOC1s.png'
    },
    {
        id: '2',
        nome: 'Leticia Soares de Lima',
        email: 'leticia.soares@ufrpe.com',
        senha: '1234@senha',
        tipo: TipoDeConta.DN,
        nucleos: [NucleosCadastrados[2]],
        status: 1
    },
    {
        id: '3',
        nome: 'Lucia Monte Alburquerque Pereira',
        email: 'lucia.monte@ufrpe.com',
        senha: '1234@senha',
        tipo: TipoDeConta.DN,
        nucleos: [NucleosCadastrados[1]],
        status: 1
    },
    {
        id: '4',
        nome: 'Lucas Pereira Santos',
        email: 'lucas.pereira@ufrpe.com',
        senha: '1234@senha',
        tipo: TipoDeConta.EG,
        nucleos: [NucleosCadastrados[0], NucleosCadastrados[3]],
        status: 0
    },
    {
        id: '5',
        nome: 'Luiz Moura da Silva',
        email: 'luiz,moura@ufrpe.com',
        senha: '1234@senha',
        tipo: TipoDeConta.EC,
        nucleos: [],
        status: 1
    },
    {
        id: '6',
        nome: 'Zé',
        email: 'ze@ufrpe.com',
        senha: '1234@senha',
        tipo: TipoDeConta.EG,
        nucleos: [NucleosCadastrados[0], NucleosCadastrados[1], NucleosCadastrados[2], NucleosCadastrados[3]],
        status: 1
    },
    {
        id: '4032839',
        nome: 'Seu Nomezinho da Silva',
        email: 'seu.nome@ufrpe.com',
        senha: '12345@senha',
        tipo: TipoDeConta.ADM,
        nucleos: [NucleosCadastrados[0], NucleosCadastrados[1], NucleosCadastrados[2], NucleosCadastrados[3]],
        status: 1
    }
];

export const UsuarioAtual: Usuario = UsuariosCadastrados[7];