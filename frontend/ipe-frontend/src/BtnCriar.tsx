import { Svg } from "./config/assets"

export function BtnCriar( {txt, acao, icon}: {txt: string, acao:() => void, icon?: string} ) {
    return (
        <button onClick={acao} className="bg-gradient-to-l from-[#a13680] to-[#3b142f] rounded-[9px] shrink-0 h-[48px] px-[20px] cursor-pointer">
            <div className="flex items-center justify-between h-full gap-3">
                <div className="size-[20px]">
                    <svg className="block size-full" fill="none" viewBox="0 0 31.2436 31.2436">
                        <path clipRule="evenodd" d={icon == null ? Svg.Mais : icon} fill="white" fillRule="evenodd" />
                    </svg>
                </div>
                <p className="font-semibold text-[16px] text-center text-white whitespace-nowrap">
                    {txt}
                </p>
            </div>
        </button>
    );
}