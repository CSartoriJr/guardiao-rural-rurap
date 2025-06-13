import Link from 'next/link';
import Image from 'next/image';
import type { AgriRequest } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/config/routes';
import { Eye, CheckCircle2, XCircle, HelpCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface RequestCardProps {
  request: AgriRequest;
}

const StatusBadge = ({ status }: { status: AgriRequest['status'] }) => {
  switch (status) {
    case 'Positive':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle2 className="mr-1 h-3 w-3" />Positive</Badge>;
    case 'Negative':
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Negative</Badge>;
    case 'Inconclusive':
      return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black"><HelpCircle className="mr-1 h-3 w-3" />Inconclusive</Badge>;
    default: // Pending
      return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
  }
};

export default function FarmerRequestCard({ request }: RequestCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg leading-tight">Cassava: {request.cassavaType}</CardTitle>
          <StatusBadge status={request.status} />
        </div>
        <CardDescription className="text-xs">
          Submitted: {format(new Date(request.submissionDate), "MMM d, yyyy 'at' h:mm a")}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex -space-x-2 overflow-hidden mb-2 justify-center sm:justify-start">
          {request.photoDataUris.slice(0,3).map((uri, index) => (
            <div key={index} className="inline-block h-16 w-16 rounded-full ring-2 ring-card bg-muted overflow-hidden" data-ai-hint="cassava plant">
              <Image
                src={uri}
                alt={`Cassava photo ${index + 1}`}
                width={64}
                height={64}
                className="object-cover h-full w-full"
              />
            </div>
          ))}
        </div>
        {request.status !== 'Pending' && request.recommendation && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            <strong>Recommendation:</strong> {request.recommendation}
          </p>
        )}
         {request.status === 'Pending' && (
          <p className="text-sm text-muted-foreground mt-2">
            Awaiting technician review.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Link href={APP_ROUTES.FARMER_VIEW_REQUEST(request.id)} passHref legacyBehavior>
          <Button variant="outline" className="w-full">
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
