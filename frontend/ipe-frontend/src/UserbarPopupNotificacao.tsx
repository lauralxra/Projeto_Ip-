import { useState } from 'react';

interface UserbarPopupNotificacaoProps {
  onClose: () => void;
  isClosing: boolean;
}

interface Notificacao {
  id: number;
  titulo: string;
  descricao: string;
  data: string;
  horario: string;
}

export function UserbarPopupNotificacao({
  onClose,
  isClosing,
}: UserbarPopupNotificacaoProps) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [criandoNotificacao, setCriandoNotificacao] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');

  // Data atual no formato YYYY-MM-DD
  const hoje = new Date();

  const dataAtual = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0'),
  ].join('-');

  // Formata a data para exibição
  const formatarData = (data: string) => {
    if (!data) return '';

    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Limpa os campos do formulário
  const limparFormulario = () => {
    setTitulo('');
    setDescricao('');
    setData('');
    setHorario('');
  };

  // Cancelar criação
  const cancelarCriacao = () => {
    limparFormulario();
    setCriandoNotificacao(false);
  };

  // Criar notificação
  const criarNotificacao = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const novaNotificacao: Notificacao = {
      id: Date.now(),
      titulo,
      descricao,
      data,
      horario,
    };

    setNotificacoes((prev) => [...prev, novaNotificacao]);

    limparFormulario();
    setCriandoNotificacao(false);
  };

  // Excluir notificação
  const excluirNotificacao = (id: number) => {
    setNotificacoes((prev) =>
      prev.filter((notificacao) => notificacao.id !== id),
    );
  };

  return (
    <div
      className={`bg-white relative w-full max-w-[360px] min-h-full transform transition-transform duration-300 ease-in-out ${
        isClosing ? 'translate-x-full' : 'translate-x-0'
      }`}
    >
      <div className="flex flex-col items-center w-full min-h-screen px-[14px] py-[27px]">
        {/* Seta de voltar */}
        <button
          onClick={criandoNotificacao ? cancelarCriacao : onClose}
          className="flex items-center justify-start w-full cursor-pointer"
          aria-label="Voltar"
        >
          <svg width="30" height="29" viewBox="0 0 30 29" fill="none">
            <path
              d="M17 5L9 13.5L17 22"
              stroke="#A13680"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Título */}
        <h1 className="text-[#A13680] text-[24px] font-normal mt-[25px] mb-[30px]">
          {criandoNotificacao ? 'Nova notificação' : 'Notificações'}
        </h1>

        {/* Formulário de criação */}
        {criandoNotificacao ? (
          <form
            onSubmit={criarNotificacao}
            className="flex flex-col w-full gap-[18px]"
          >
            {/* Título */}
            <div className="flex flex-col gap-[6px]">
              <label
                htmlFor="tituloNotificacao"
                className="text-[#664466] text-[14px]"
              >
                Título
              </label>

              <input
                id="tituloNotificacao"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Digite o título"
                maxLength={100}
                required
                className="w-full border border-[#D0D0D0] rounded-[8px] px-[12px] py-[10px] text-[14px] text-[#555555] outline-none focus:border-[#A13680]"
              />
            </div>

            {/* Descrição */}
            <div className="flex flex-col gap-[6px]">
              <label
                htmlFor="descricaoNotificacao"
                className="text-[#664466] text-[14px]"
              >
                Descrição
              </label>

              <textarea
                id="descricaoNotificacao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Digite a descrição da notificação"
                rows={5}
                maxLength={500}
                required
                className="w-full resize-none border border-[#D0D0D0] rounded-[8px] px-[12px] py-[10px] text-[14px] text-[#555555] outline-none focus:border-[#A13680]"
              />
            </div>

            {/* Data */}
            <div className="flex flex-col gap-[6px]">
              <label
                htmlFor="dataNotificacao"
                className="text-[#664466] text-[14px]"
              >
                Data prevista de envio
              </label>

              <input
                id="dataNotificacao"
                type="date"
                value={data}
                min={dataAtual}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full border border-[#D0D0D0] rounded-[8px] px-[12px] py-[10px] text-[14px] text-[#555555] outline-none focus:border-[#A13680]"
              />
            </div>

            {/* Horário */}
            <div className="flex flex-col gap-[6px]">
              <label
                htmlFor="horarioNotificacao"
                className="text-[#664466] text-[14px]"
              >
                Horário previsto de envio
              </label>

              <input
                id="horarioNotificacao"
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                required
                className="w-full border border-[#D0D0D0] rounded-[8px] px-[12px] py-[10px] text-[14px] text-[#555555] outline-none focus:border-[#A13680]"
              />
            </div>

            {/* Botões */}
            <div className="flex w-full gap-[10px] mt-[10px]">
              <button
                type="button"
                onClick={cancelarCriacao}
                className="flex-1 py-[10px] rounded-[8px] border border-[#664466] text-[#664466] hover:bg-[#F7F2F7] transition-colors cursor-pointer text-[14px]"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex-1 py-[10px] rounded-[8px] bg-[#664466] hover:bg-[#795779] text-white transition-colors cursor-pointer text-[14px]"
              >
                Criar
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Lista de notificações */}
            <div className="flex flex-col w-full gap-[12px] overflow-y-auto flex-1">
              {notificacoes.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className="relative flex items-start gap-[12px] w-full p-[14px] pr-[40px] rounded-[14px] shadow-[0_2px_6px_rgba(0,0,0,0.15)] border border-[#EEEEEE]"
                >
                  {/* Botão excluir */}
                  <button
                    onClick={() => excluirNotificacao(notificacao.id)}
                    className="absolute top-[10px] right-[10px] flex items-center justify-center size-[26px] rounded-full text-[#A6A6A6] hover:text-[#A13680] hover:bg-[#F7F0F6] transition-colors cursor-pointer"
                    aria-label={`Excluir notificação ${notificacao.titulo}`}
                    title="Excluir notificação"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 10v7M14 10v7"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* Ícone */}
                  <div className="flex items-center justify-center size-[42px] shrink-0 rounded-full bg-[#664666]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex flex-col flex-1 min-w-0 gap-[5px]">
                    <h2 className="text-[#A13680] text-[15px] font-medium break-words">
                      {notificacao.titulo}
                    </h2>

                    <p className="text-[#777777] text-[13px] leading-[18px] break-words">
                      {notificacao.descricao}
                    </p>

                    {/* Data de envio */}
                    <div className="flex items-center gap-[5px] mt-[5px]">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
                          stroke="#A13680"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <span className="text-[#888888] text-[12px]">
                        Envio previsto: {formatarData(notificacao.data)} às{' '}
                        {notificacao.horario}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Estado vazio */}
              {notificacoes.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 w-full">
                  <p className="text-[#A6A6A6] text-[14px] text-center">
                    Nenhuma notificação cadastrada.
                  </p>
                </div>
              )}
            </div>

            {/* Botão adicionar */}
            <button
              onClick={() => setCriandoNotificacao(true)}
              className="flex items-center justify-center size-[42px] rounded-full bg-[#664466] hover:bg-[#795779] transition-colors cursor-pointer mt-[20px] mb-[25px] shrink-0"
              aria-label="Adicionar notificação"
              title="Adicionar notificação"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5V19M5 12H19"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Borda */}
      <div
        aria-hidden="true"
        className="absolute inset-0 border border-[#D0D0D0] pointer-events-none"
      />
    </div>
  );
}
