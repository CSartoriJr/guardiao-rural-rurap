import type { HTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface CacaBruxaLogoProps extends HTMLAttributes<HTMLDivElement> {
  // className can control overall container styling
}

export function CacaBruxaLogo({ className, ...props }: CacaBruxaLogoProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center", // Centering content
        className
      )}
      {...props}
    >
      <span className="text-xl font-bold text-success leading-none">
        RURAP
      </span>
      <span className="text-center text-[0.625rem] text-muted-foreground uppercase mt-1 tracking-wide font-bold">
        INSTITUTO DE EXTENSÃO, ASSISTÊNCIA E DESENVOLVIMENTO RURAL DO AMAPÁ
      </span>
    </div>
  );
}
