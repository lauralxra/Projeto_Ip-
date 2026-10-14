import { Link } from 'react-router-dom';
import {Imagens} from './config/assets';
import { 
  LayoutDashboard, 
  Layers, 
  FolderKanban, 
  BarChart3, 
  MessageSquare, 
  History
} from 'lucide-react';

export function NavBar() {
    return(
        <aside className="w-64 bg-[#3a182d] text-white flex flex-col justify-between p-6 hidden md:flex shrink-0">
            <div>
                {/* Logo IPÊ */}
                <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-full bg-[#fce8f3]/20 flex items-center justify-center text-xl">
                    <img alt="" className="relative h-[135.8%] left-0 max-w-none top-[-0.07%] w-[135.8%]" src={Imagens.LogoIPE}/>
                </div>
                <span className="font-bold text-xl tracking-wide">IPÊ</span>
                </div>

                {/* Menu de Navegação */}
                <nav className="space-y-2">
                <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </Link>
                <Link to="/nucleos" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                    <Layers size={20} />
                    <span>Núcleos</span>
                </Link>
                <a href="#programas" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                    <FolderKanban size={20} />
                    <span>Programas</span>
                </a>
                <a href="#indicadores" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                    <BarChart3 size={20} />
                    <span>Indicadores</span>
                </a>
                <a href="#forum" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                    <MessageSquare size={20} />
                    <span>Fórum</span>
                </a>
                <a href="#historico" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                    <History size={20} />
                    <span>Histórico</span>
                </a>
                </nav>
            </div>

            {/* Rodapé da Sidebar */}
            <div className="text-xs text-white/50 px-2">
                Instituto IPÊ • UFRPE
            </div>
        </aside>
    )
}