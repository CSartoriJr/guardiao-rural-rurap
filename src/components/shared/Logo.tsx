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
        "relative h-10 w-[183px]", // Default size, aspect ratio ~183/40 based on original image 789x172
        className // Allow overriding
      )}
      {...props}
    >
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/app-protyper.appspot.com/o/7f31fdc1-2d1f-4176-a4c4-4bfec1d107dd.png?alt=media&token=8b6817c1-080e-48f4-b633-5c82983986bb"
        alt="RURAP Logo"
        layout="fill"
        objectFit="contain"
        priority
      />
    </div>
  );
}
