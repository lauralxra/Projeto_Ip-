import { Svg } from "./config/assets";

interface DropdownFiltroProps {
    icon: string;
    label: string;
    valor: string;
    onChange: (val: string) => void;
    opcoes: string[];
}

export function CustomDropdown({ icon, label, valor, onChange, opcoes }: DropdownFiltroProps) {
    return (
        <div className="bg-transparent border-2 border-[#3b142f] flex h-[48px] items-center justify-between px-[16px] rounded-[9px] shrink-0 w-[190px] relative cursor-pointer">
          
          {/* icone */}
          <div className="size-[20px] relative shrink-0 pointer-events-none">
            <svg className="block size-full" fill="none" viewBox="0 0 34.125 32.5">
              <path d={icon} fill="#3B142F" />
            </svg>
          </div>

          {/* dropdown funcional */}
          <select 
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          >
            <option value="">{label} (Todos)</option>
            {opcoes.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>

          {/* texto  */}
          <p className="font-normal text-[#3d3d3d] text-[15px] whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none flex-1 ml-2">
              {valor ? valor : label}
          </p>

          {/* setinha */}
          <div className="h-[8px] w-[12px] pointer-events-none shrink-0">
              <svg className="block size-full" fill="none" viewBox="0 0 16.2247 10.0188">
                <path d={Svg.SetaBaixo} fill="#191919" />
              </svg>
          </div>
        </div>
    );
}