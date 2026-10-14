import { LoaderCircle } from 'lucide-react';
import { Brand } from './Brand';

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas">
      <Brand />
      <LoaderCircle className="animate-spin text-sea-600" size={27} aria-label="Carregando" />
      <p className="text-sm text-slate-500">Preparando seu espaço...</p>
    </div>
  );
}
