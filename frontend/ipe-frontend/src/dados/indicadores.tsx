import { NucleosCadastrados, type Nucleo } from "./nucleos";
import type { Programa } from "./programas";

export interface Indicador {
  id: string;
  nome: string;
  unidade: string;
  simbolUni?: string;
  meta?: string;
  valAtual: string;
  nucleo?: Nucleo;
  programa?: Programa;
  status: string;
  aprovado: boolean;
}

export const IndicadoresCadastrados: Indicador[] = [
  {
    id: '0',
    nome: 'Número de Pessoas Atendidas',
    unidade: 'Unidade',
    valAtual: '1248',
    nucleo: NucleosCadastrados[1],
    status: 'ativo',
    aprovado: true
  },
  {
    id: '1',
    nome: 'Taxa de reciclagem de resíduos',
    unidade: 'Porcentagem',
    simbolUni: '%',
    meta: '100',
    valAtual: '65',
    nucleo: NucleosCadastrados[0],
    status: 'ativo',
    aprovado: false
  },
  {
    id: '2',
    nome: 'Redução de emissão de Co2',
    unidade: 'Toneladas',
    simbolUni: 't',
    meta: '50',
    valAtual: '12',
    nucleo: NucleosCadastrados[2],
    status: 'ativo',
    aprovado: false
  },
  {
    id: '3',
    nome: 'Pessoas capacitadas',
    unidade: 'Unidade',
    meta: '10',
    valAtual: '13',
    nucleo: NucleosCadastrados[2],
    status: 'ativo',
    aprovado: true
  }
];