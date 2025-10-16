import Link from 'next/link';
import Image from 'next/image';
import type { AgriRequest, RegistrationStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { APP_ROUTES } from '@/config/routes';
import { Eye, User, CalendarDays, CheckCircle2, XCircle, HelpCircle, Clock, Sprout, AlertCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TechnicianRequestCardProps {
  request: AgriRequest;
}

const StatusBadge = ({ status }: { status: AgriRequest['status'] }) => {
  switch (status) {
    case 'Positive':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle2 className="mr-1 h-3 w-3" />Positivo</Badge>;
    case 'Negative':
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Possivelmente Negativo</Badge>;
    case 'Inconclusive':
      return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black"><HelpCircle className="mr-1 h-3 w-3" />Inconclusivo</Badge>;
    case 'Suspeita de Infecção':
        return <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white"><AlertCircleIcon className="mr-1 h-3 w-3" />Suspeita</Badge>;
    default: // Pending
      return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
  }
};

const RegistrationStatusBadge = ({ status }: { status?: RegistrationStatus }) => {
  if (!status) return null;
  
  let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
  if (status === 'Confirmado') variant = 'default';
  if (status === 'Inapto') variant = 'destructive';

  return <Badge variant={variant} className="text-xs font-medium">{status}</Badge>;
}

const getPlantAndVarietyDisplay = (req: AgriRequest): string => {
    const plantTypes = [];
    if (req.isMandioca) plantTypes.push('Mandioca');
    if (req.isMacaxeira) plantTypes.push('Macaxeira');
    const plantTypeStr = plantTypes.join(' / ') || 'Não especificado';

    const varieties = [];
    if (req.mandiocaVariety) varieties.push(req.mandiocaVariety);
    if (req.macaxeiraVariety) varieties.push(req.macaxeiraVariety);
    const varietyStr = varieties.join(' / ');

    if (varietyStr) {
        return `${plantTypeStr}: ${varietyStr}`;
    }
    return plantTypeStr;
}

export default function TechnicianRequestCard({ request }: TechnicianRequestCardProps) {
    // Ensure photoUrls is an array and has at least 3 elements, providing placeholders if not.
  const photoDisplayUrls = (
    Array.isArray(request.photoUrls) && request.photoUrls.length >= 3
    ? request.photoUrls.slice(0, 3)
    : ['https://placehold.co/48x48.png', 'https://placehold.co/48x48.png', 'https://placehold.co/48x48.png']
  ).map(url => url || 'https://placehold.co/48x48.png'); // Ensure no null/undefined URLs

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="font-headline text-lg">Solicitação #{request.id.substring(0, 6).toUpperCase()}</CardTitle>
          <StatusBadge status={request.status} />
        </div>
        <div className="flex justify-between items-center">
            <CardDescription className="text-xs truncate pr-2">ID: {request.id}</CardDescription>
            <Button asChild variant="default" size="sm" className="bg-primary hover:bg-primary/90 h-7 px-2 text-xs ml-auto flex-shrink-0">
              <Link href={APP_ROUTES.TECHNICIAN_VIEW_REQUEST(request.id)}>
                  <Eye className="mr-1 h-3 w-3" /> Ver
              </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 py-3 flex-grow">
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-2 text-primary" />
          <span>Agricultor: {request.farmerName || request.farmerId}</span>
        </div>
         <div className="flex items-center text-sm text-muted-foreground">
            <Sprout className="h-4 w-4 mr-2 text-primary" />
            <span>{getPlantAndVarietyDisplay(request)}</span>
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
      <CardFooter className="pt-2 flex justify-end items-center gap-2">
        <span className="text-xs text-muted-foreground">Cadastro:</span>
        <RegistrationStatusBadge status={request.farmerRegistrationStatus} />
      </CardFooter>
    </Card>
  );
}
