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
      <span className="text-[45px] font-bold text-accent leading-none">
        RURAP
      </span>
      <span className="text-[0.625rem] text-muted-foreground uppercase mt-1 whitespace-nowrap tracking-wide font-bold">
        INSTITUTO DE EXTENSÃO, ASSISTÊNCIA E DESENVOLVIMENTO RURAL DO AMAPÁ
      </span>
    </div>
  );
}
