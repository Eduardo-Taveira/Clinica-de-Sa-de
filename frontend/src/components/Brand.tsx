import { Plus } from 'lucide-react';

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="Vida Clínica">
      <span className={`flex h-11 w-11 items-center justify-center rounded-[16px] ${light ? 'bg-white/15' : 'bg-navy-900'}`}>
        <Plus size={30} strokeWidth={3.6} className="text-sea-400" />
      </span>
      <span className={`text-[20px] font-extrabold tracking-[-0.04em] ${light ? 'text-white' : 'text-navy-900'}`}>
        vida<span className="text-sea-500">.</span><span className="text-[15px] font-semibold tracking-tight">clínica</span>
      </span>
    </div>
  );
}
