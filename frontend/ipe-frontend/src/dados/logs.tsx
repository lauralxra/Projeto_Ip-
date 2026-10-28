import type { Nucleo } from "./nucleos";
import { UsuariosCadastrados, type Usuario } from "./usuarios";

export type TipoDeLog = 'Adicao' | 'Edicao' | 'Exclusao' | 'Cadastro' | 'Resposta'
export interface Log {
    id: string;
    tipo: TipoDeLog;
    acao: string;
    descricao: string;
    individuo: Usuario;
    nucleo: Nucleo;
    data: Date;
}

export const Historico: Log[] = [
    {
        id: '0',
        tipo: 'Adicao',
        acao: 'Criou o sistema',
        descricao: 'Criou um sistema do zero no sistema.',
        individuo: UsuariosCadastrados[0],
        nucleo: UsuariosCadastrados[0].nucleos[0],
        data: new Date(2024, 3, 10, 18, 5, 40)
    },
    {
        id: '1',
        tipo: 'Resposta',
        acao: 'Tropeçou numa casca de banana',
        descricao: 'Estava andando sem prestar atenção e quase morreu.',
        individuo: UsuariosCadastrados[6],
        nucleo: UsuariosCadastrados[6].nucleos[0],
        data: new Date(2024, 8, 25, 11, 34)
    },
    {
        id: '2',
        tipo: 'Cadastro',
        acao: 'Cadastrou um novo núcleo',
        descricao: 'Núcleo de Internacionalização criado com a sigla NINTER.',
        individuo: UsuariosCadastrados[0],
        nucleo: UsuariosCadastrados[0].nucleos[0],
        data: new Date(2024, 8, 26, 8, 3)
    },
    {
        id: '3',
        tipo: 'Exclusao',
        acao: 'Excluiu um comentário',
        descricao: 'Removeu um comentário de forma permanente.',
        individuo: UsuariosCadastrados[2],
        nucleo: UsuariosCadastrados[2].nucleos[0],
        data: new Date(2024, 8, 27, 7, 11)
    },
    {
        id: '4',
        tipo: 'Resposta',
        acao: 'Respondeu no fórum',
        descricao: 'Adicionou resposta “Melhor trocar o título” em “Introdução”.',
        individuo: UsuariosCadastrados[3],
        nucleo: UsuariosCadastrados[3].nucleos[0],
        data: new Date(2024, 8, 27, 17, 49)
    },
    {
        id: '5',
        tipo: 'Edicao',
        acao: 'Editou Fórum',
        descricao: 'Atualizou o título da discussão “Introdução” para “Boas vindas”.',
        individuo: UsuariosCadastrados[1],
        nucleo: UsuariosCadastrados[1].nucleos[0],
        data: new Date(2024, 8, 27, 18, 25)
    },
    {
        id: '6',
        tipo: 'Resposta',
        acao: 'Respondeu no fórum',
        descricao: 'Adicionou resposta “Ideias de títulos melhores” em “Boas vindas”.',
        individuo: UsuariosCadastrados[3],
        nucleo: UsuariosCadastrados[3].nucleos[0],
        data: new Date(2024, 8, 27, 19, 1)
    },
    {
        id: '7',
        tipo: 'Cadastro',
        acao: 'Cadastrou um novo usuário',
        descricao: 'Casdastro de um novo usuário no núcleo NURI.',
        individuo: UsuariosCadastrados[0],
        nucleo: UsuariosCadastrados[0].nucleos[0],
        data: new Date(2024, 8, 28, 14, 32)
    },
    {
        id: '8',
        tipo: 'Edicao',
        acao: 'Editou núcleo',
        descricao: 'Alterou a descrição do núcleo e atualizou a imagem/símbolo.',
        individuo: UsuariosCadastrados[0],
        nucleo: UsuariosCadastrados[0].nucleos[0],
        data: new Date(2024, 8, 28, 14, 40)
    }
]