import type { HTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface CacaBruxaLogoProps extends HTMLAttributes<HTMLDivElement> {
  // className can control overall container styling
}

export function CacaBruxaLogo({ className, ...props }: CacaBruxaLogoProps) {
  return (
    <div
      className={cn(
        "flex flex-col", // Allows text to stack vertically
        className
      )}
      {...props}
    >
      <span className="text-xl font-bold text-accent">
        RURAP
      </span>
      <span className="text-[0.5rem] text-muted-foreground lowercase leading-tight max-w-[150px]">
        INSTITUTO DE EXTENSÃO, ASSISTÊNCIA E DESENVOLVIMENTO RURAL DO AMAPÁ
      </span>
    </div>
  );
}
