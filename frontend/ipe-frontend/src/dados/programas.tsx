import { NucleosCadastrados, type Nucleo } from "./nucleos";
import { UsuariosCadastrados, type Usuario } from "./usuarios";

export interface Programa {
    id: string;
    nome: string;
    nucleo: Nucleo;
    descricao: string;
    dataDeInicio: Date;
    status: string;
    responsavel: Usuario;
    participantes: Usuario[];
}

export const programasCadastrados: Programa[] = [
    {
        id: "0",
        nome: "Programa de Sustentabilidade e Impacto Social",
        nucleo: NucleosCadastrados[0],
        descricao: "Iniciativa voltada para promover práticas sustentáveis e fortalecer o impacto social das ações do IPÊ.",
        dataDeInicio: new Date(2024, 3, 10),
        status: "Ativo",
        responsavel: UsuariosCadastrados[0],
        participantes: []
    },
    {
        id: "1",
        nome: "Programa de Aceleração de Startups",
        nucleo: NucleosCadastrados[0],
        descricao: "Foco em Startups rápidas.",
        dataDeInicio: new Date(2024, 3, 25),
        status: "Ativo",
        responsavel: UsuariosCadastrados[0],
        participantes: []
    },
    {
        id: "2",
        nome: "Programa de parcerias  acadêmicas e internacionais",
        nucleo: NucleosCadastrados[2],
        descricao: "Fomenta a colaboração com universidades estrangeiras para intercâmbios e pesquisas conjuntas.",
        dataDeInicio: new Date(2024, 2, 18),
        status: "Ativo",
        responsavel: UsuariosCadastrados[0],
        participantes: []
    },
    {
        id: "3",
        nome: "Programa de inovação em políticas públicas",
        nucleo: NucleosCadastrados[1],
        descricao: "Desenvolve soluções e pesquisas para fortalecer a gestão pública e ampliar o acesso a direitos.",
        dataDeInicio: new Date(2024, 7, 1),
        status: "Ativo",
        responsavel: UsuariosCadastrados[0],
        participantes: []
    },
    {
        id: "3",
        nome: "Programa principal",
        nucleo: NucleosCadastrados[3],
        descricao: "O principal",
        dataDeInicio: new Date(2023, 1, 1),
        status: "Ativo",
        responsavel: UsuariosCadastrados[0],
        participantes: []
    }
]