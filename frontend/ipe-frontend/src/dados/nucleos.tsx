import { Imagens } from '../config/assets';

export interface Nucleo {
    id: string;
    nome: string;
    sigla: string;
    descricao: string;
    corBg: string;
    corIcone: string;
    logoTexto?: string;
    icone?: string;
}

export const NucleosCadastrados: Nucleo[] = [
    {
        id: '0',
        nome: 'Núcleo de Empreendedorismo',
        sigla: 'NEI',
        descricao: 'Apoio à criação e desenvolvimento de negócios',
        corBg: 'bg-[#5c3a82]',
        corIcone: 'text-white',
        logoTexto: 'NEI'
    },
    {
        id: '1',
        nome: 'Núcleo de Relações Institucionais',
        sigla: 'NURI',
        descricao: 'Articulação de parcerias e relações institucionais',
        corBg: 'bg-[#6b6e77]',
        corIcone: 'text-white',
        logoTexto: 'NURI'
    },
    {
        id: '2',
        nome: 'Núcleo de Internacionalização',
        sigla: 'NINTER',
        descricao: 'Conexões e oportunidades de cooperação internacional',
        corBg: 'bg-[#d99738]',
        corIcone: 'text-white',
        logoTexto: 'NINTER'
    },
    {
        id: '3',
        nome: 'Núcleo do Instituto IPÊ',
        sigla: 'IPÊ',
        descricao: 'Gestão e acompanhamento das iniciativas do IPÊ',
        corBg: 'bg-[#fcf2f7]',
        corIcone: 'text-[#832b62]',
        icone: Imagens.LogoIPE
    }
];