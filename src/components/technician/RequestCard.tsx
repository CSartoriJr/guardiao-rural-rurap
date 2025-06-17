
import Link from 'next/link';
import Image from 'next/image';
import type { AgriRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/config/routes';
import { Eye, User, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TechnicianRequestCardProps {
  request: AgriRequest;
}

export default function TechnicianRequestCard({ request }: TechnicianRequestCardProps) {
    // Ensure photoUrls is an array and has at least 3 elements, providing placeholders if not.
  const photoDisplayUrls = (
    Array.isArray(request.photoUrls) && request.photoUrls.length >= 3
    ? request.photoUrls.slice(0, 3)
    : ['https://placehold.co/48x48.png', 'https://placehold.co/48x48.png', 'https://placehold.co/48x48.png']
  ).map(url => url || 'https://placehold.co/48x48.png'); // Ensure no null/undefined URLs


  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row justify-between items-start pb-2">
        <div>
          <CardTitle className="font-headline text-lg">Pedido: {request.cassavaType}</CardTitle>
          <CardDescription className="text-xs">ID do Pedido: {request.id}</CardDescription>
        </div>
        <Link href={APP_ROUTES.TECHNICIAN_VIEW_REQUEST(request.id)} className="ml-auto">
          <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
            <Eye className="mr-1 h-4 w-4" /> Ver
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3 py-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-2 text-primary" />
          <span>Agricultor: {request.farmerName || request.farmerId}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 mr-2 text-primary" />
          <span>Enviado: {request.submissionDate ? format(new Date(request.submissionDate), "d 'de' MMM, yyyy", { locale: ptBR }) : 'Data Indisponível'}</span>
        </div>
        <div className="flex -space-x-2 overflow-hidden mt-2 justify-center sm:justify-start">
          {photoDisplayUrls.map((url, index) => (
             <div key={index} className="inline-block h-12 w-12 rounded-full ring-2 ring-card bg-muted overflow-hidden" data-ai-hint="cassava plant">
                <Image
                    src={url} // Use Firebase Storage URL
                    alt={`Miniatura ${index + 1}`}
                    width={48}
                    height={48}
                    className="object-cover h-full w-full"
                    unoptimized={url.startsWith('https://placehold.co')} // Avoid optimization for placeholder
                />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
