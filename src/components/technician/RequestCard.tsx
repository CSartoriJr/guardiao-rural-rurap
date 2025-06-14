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
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row justify-between items-start pb-2">
        <div>
          <CardTitle className="font-headline text-lg">Pedido: {request.cassavaType}</CardTitle>
          <CardDescription className="text-xs">ID do Pedido: {request.id}</CardDescription>
        </div>
        <Link href={APP_ROUTES.TECHNICIAN_VIEW_REQUEST(request.id)} passHref>
          <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90 ml-auto">
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
          <span>Enviado: {format(new Date(request.submissionDate), "d 'de' MMM, yyyy", { locale: ptBR })}</span>
        </div>
        <div className="flex -space-x-2 overflow-hidden mt-2 justify-center sm:justify-start">
          {request.photoDataUris.slice(0,3).map((uri, index) => (
             <div key={index} className="inline-block h-12 w-12 rounded-full ring-2 ring-card bg-muted overflow-hidden" data-ai-hint="cassava plant">
                <Image
                    src={uri}
                    alt={`Miniatura ${index + 1}`}
                    width={48}
                    height={48}
                    className="object-cover h-full w-full"
                />
            </div>
          ))}
        </div>
      </CardContent>
      {/* CardFooter has been removed */}
    </Card>
  );
}
