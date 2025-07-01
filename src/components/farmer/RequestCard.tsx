
import Link from 'next/link';
import Image from 'next/image';
import type { AgriRequest } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/config/routes';
import { Eye, CheckCircle2, XCircle, HelpCircle, Clock, Sprout } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RequestCardProps {
  request: AgriRequest;
}

const StatusBadge = ({ status }: { status: AgriRequest['status'] }) => {
  switch (status) {
    case 'Positive':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle2 className="mr-1 h-3 w-3" />Positivo</Badge>;
    case 'Negative':
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Negativo</Badge>;
    case 'Inconclusive':
      return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black"><HelpCircle className="mr-1 h-3 w-3" />Inconclusivo</Badge>;
    default: // Pending
      return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
  }
};

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


export default function FarmerRequestCard({ request }: RequestCardProps) {
  // Ensure photoUrls is an array and has at least 3 elements, providing placeholders if not.
  const photoDisplayUrls = (
    Array.isArray(request.photoUrls) && request.photoUrls.length >= 3
    ? request.photoUrls.slice(0, 3)
    : ['https://placehold.co/64x64.png', 'https://placehold.co/64x64.png', 'https://placehold.co/64x64.png']
  ).map(url => url || 'https://placehold.co/64x64.png'); // Ensure no null/undefined URLs

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg leading-tight">Levantamento #{request.id.substring(0, 6).toUpperCase()}</CardTitle>
          <StatusBadge status={request.status} />
        </div>
        <CardDescription className="text-xs">
          Enviado: {request.submissionDate ? format(new Date(request.submissionDate), "d 'de' MMM, yyyy", { locale: ptBR }) : 'Data indisponível'}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-2 flex-grow">
        <div className="flex items-center text-sm text-muted-foreground mb-3">
            <Sprout className="h-4 w-4 mr-2 text-primary" />
            <span>{getPlantAndVarietyDisplay(request)}</span>
        </div>
        <div className="flex -space-x-2 overflow-hidden mb-2 justify-center sm:justify-start">
          {photoDisplayUrls.map((url, index) => (
            <div key={index} className="inline-block h-16 w-16 rounded-full ring-2 ring-card bg-muted overflow-hidden" data-ai-hint="cassava plant">
              <Image
                src={url} // Use Firebase Storage URL
                alt={`Foto da mandioca ${index + 1}`}
                width={64}
                height={64}
                className="object-cover h-full w-full"
                unoptimized={url.startsWith('https://placehold.co')} // Avoid optimization for placeholder
              />
            </div>
          ))}
        </div>
        {request.status !== 'Pending' && request.recommendation && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            <strong>Recomendação:</strong> {request.recommendation}
          </p>
        )}
         {request.status === 'Pending' && (
          <p className="text-sm text-muted-foreground mt-2">
            Aguardando revisão do técnico.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Link href={APP_ROUTES.FARMER_VIEW_REQUEST(request.id)} className="w-full">
          <Button variant="outline" className="w-full">
            <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
