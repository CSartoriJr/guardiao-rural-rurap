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
        "flex items-center justify-center", // To center the image within this div
        "h-10 w-[183px]", // Maintain parent dimensions for layout consistency
        className // Allow overriding container size
      )}
      {...props}
    >
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/app-protyper.appspot.com/o/7f31fdc1-2d1f-4176-a4c4-4bfec1d107dd.png?alt=media&token=8b6817c1-080e-48f4-b633-5c82983986bb"
        alt="RURAP Logo"
        width={183} // Explicit width
        height={40}  // Explicit height, maintaining aspect ratio of ~183/40
        objectFit="contain" // Ensures the image scales down to fit
        priority // Keep if it's LCP
      />
    </div>
  );
}
