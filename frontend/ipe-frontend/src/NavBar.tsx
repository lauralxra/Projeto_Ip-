import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Imagens } from './config/assets';
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  BarChart3,
  History,
  Users,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { lerUsuarioSessao, encerrarSessaoLocal } from './routes/sessao';

export function NavBar() {
  const [mobileAberto, setMobileAberto] = useState(false);
  const [colapsado, setColapsado] = useState(false);
  const [, setVersaoUsuario] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = lerUsuarioSessao();

  useEffect(() => {
    const atualizar = () => setVersaoUsuario((v) => v + 1);
    window.addEventListener('usuario-atualizado', atualizar);
    return () => window.removeEventListener('usuario-atualizado', atualizar);
  }, []);

  const handleLogout = () => {
    encerrarSessaoLocal();
    navigate('/login');
  };

  const podeAcessarHistorico =
    usuario?.perfil === 'ADMINISTRADOR' || usuario?.perfil === 'EQUIPE_GESTAO';

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/nucleos', label: 'Núcleos', icon: Layers },
    { to: '/programas', label: 'Programas', icon: FolderKanban },
    { to: '/indicadores', label: 'Indicadores', icon: BarChart3 },
    ...(podeAcessarHistorico
      ? [{ to: '/historico', label: 'Histórico', icon: History }]
      : []),
    ...(usuario?.perfil === 'ADMINISTRADOR'
      ? [{ to: '/usuarios', label: 'Usuários', icon: Users }]
      : []),
  ];

  const renderNavLinks = (isMobile = false) => (
    <nav className="space-y-1.5 w-full">
      {navLinks.map((item) => {
        const Icon = item.icon;
        const ativo = location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => isMobile && setMobileAberto(false)}
            title={colapsado && !isMobile ? item.label : undefined}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-medium text-sm ${
              colapsado && !isMobile ? 'justify-center' : ''
            } ${
              ativo
                ? 'bg-white/15 text-white shadow-xs font-semibold'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={20} className="shrink-0" />
            {(!colapsado || isMobile) && (
              <span className="truncate">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ================= BARRA SUPERIOR MOBILE (telas < 768px) ================= */}
      <header className="md:hidden w-full bg-[#3a182d] text-white flex items-center justify-between px-4 py-3 shrink-0 shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileAberto(true)}
            className="p-2 -ml-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Abrir menu de navegação"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#fce8f3]/20 flex items-center justify-center overflow-hidden">
              <img
                alt="Logo IPÊ"
                className="w-full h-full object-contain"
                src={Imagens.LogoIPE}
              />
            </div>
            <span className="font-bold text-lg tracking-wide">IPÊ</span>
          </div>
        </div>

        {usuario && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70 truncate max-w-[120px]">
              {usuario.nome?.split(' ')[0]}
            </span>
            <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold uppercase">
              {usuario.nome?.charAt(0) || 'U'}
            </div>
          </div>
        )}
      </header>

      {/* ================= DRAWER OVERLAY MOBILE ================= */}
      {mobileAberto && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileAberto(false)}
          aria-hidden="true"
        />
      )}

      {/* ================= DRAWER LATERAL MOBILE (SLIDE-IN) ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#3a182d] text-white flex flex-col justify-between p-6 shadow-2xl transition-transform duration-300 md:hidden ${
          mobileAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Topo do Drawer */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fce8f3]/20 flex items-center justify-center p-1.5">
                <img
                  alt="Logo IPÊ"
                  className="w-full h-full object-contain"
                  src={Imagens.LogoIPE}
                />
              </div>
              <div>
                <span className="font-bold text-xl tracking-wide block">
                  IPÊ
                </span>
                <span className="text-[10px] text-white/50 block">
                  Plataforma Institucional
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileAberto(false)}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fechar menu"
            >
              <X size={22} />
            </button>
          </div>

          {/* Links do Menu */}
          {renderNavLinks(true)}
        </div>

        {/* Rodapé Mobile: Usuário & Logout */}
        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          {usuario && (
            <div className="flex items-center gap-3 px-1">
              <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                {usuario.nome?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {usuario.nome}
                </p>
                <p className="text-xs text-white/50 truncate">
                  {usuario.perfil?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors text-sm w-full cursor-pointer"
          >
            <LogOut size={18} />
            <span>Encerrar Sessão</span>
          </button>
          <div className="text-[11px] text-white/40 px-1 text-center">
            Instituto IPÊ • UFRPE
          </div>
        </div>
      </aside>

      {/* ================= SIDEBAR DESKTOP (telas >= 768px) ================= */}
      <aside
        className={`bg-[#3a182d] text-white flex-col justify-between p-5 hidden md:flex shrink-0 h-screen transition-all duration-300 relative z-20 ${
          colapsado ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col items-center w-full">
          {/* Header Desktop com botão de recolher/expandir */}
          <div
            className={`flex items-center mb-8 px-1 w-full ${
              colapsado ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fce8f3]/20 flex items-center justify-center shrink-0 p-1.5">
                <img
                  alt="Logo IPÊ"
                  className="w-full h-full object-contain"
                  src={Imagens.LogoIPE}
                />
              </div>
              {!colapsado && (
                <div>
                  <span className="font-bold text-xl tracking-wide block">
                    IPÊ
                  </span>
                  <span className="text-[10px] text-white/50 block">
                    Painel de Gestão
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setColapsado(!colapsado)}
              className="hidden lg:flex p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={
                colapsado ? 'Expandir barra lateral' : 'Recolher barra lateral'
              }
              aria-label={
                colapsado ? 'Expandir barra lateral' : 'Recolher barra lateral'
              }
            >
              {colapsado ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
          </div>

          {/* Links de Navegação */}
          {renderNavLinks(false)}
        </div>

        {/* Rodapé Desktop */}
        <div className="border-t border-white/10 pt-4 flex flex-col gap-3 w-full">
          {usuario && !colapsado && (
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                {usuario.nome?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {usuario.nome}
                </p>
                <p className="text-[11px] text-white/50 truncate">
                  {usuario.perfil?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title={colapsado ? 'Encerrar Sessão' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors text-xs w-full cursor-pointer ${
              colapsado ? 'justify-center' : ''
            }`}
          >
            <LogOut size={16} />
            {!colapsado && <span>Sair</span>}
          </button>

          {!colapsado && (
            <div className="text-[11px] text-white/40 px-1 text-center">
              Instituto IPÊ • UFRPE
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
