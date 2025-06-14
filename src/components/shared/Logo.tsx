import Image from 'next/image';
import type { HTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface CacaBruxaLogoProps extends HTMLAttributes<HTMLDivElement> {
  // className can control width/height of the container div
}

export function CacaBruxaLogo({ className, ...props }: CacaBruxaLogoProps) {
  return (
    <div
      className={cn(
        "relative", 
        "h-[40px] w-[40px]", // Updated container dimensions for 40x40
        className 
      )}
      {...props}
    >
      <Image
        src="https://rurap.portal.ap.gov.br/img/Logo_RURAP.png" // New image source
        alt="RURAP Logo"
        width={40} // New width
        height={40}  // New height
        style={{
          objectFit: "contain", 
        }}
        priority 
      />
    </div>
  );
}
