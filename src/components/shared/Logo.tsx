import { Leaf } from 'lucide-react';
import type { SVGProps } from 'react';

export function AgriAssistLogo({ className, ...props }: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Leaf className={cn("h-7 w-7 text-primary", className)} {...props} />
      <span className="text-2xl font-headline font-bold text-primary">AgriAssist</span>
    </div>
  );
}

// Helper for cn if not globally available in this file, or import from lib/utils
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
