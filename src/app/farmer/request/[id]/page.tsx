'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import PageWrapper from '@/components/shared/PageWrapper';
import type { AgriRequest } from '@/types';
import { mockRequests } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge }   from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, Clock, CalendarDays, User, Microscope, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';

// Mock function to fetch a single request
const fetchRequestById = async (requestId: string): Promise<AgriRequest | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRequests.find(req => req.id === requestId);
};

const StatusDisplay = ({ status, recommendation, technicianName, responseDate }: Pick<AgriRequest, 'status' | 'recommendation' | 'technicianName' | 'responseDate'>) => {
  let IconComponent;
  let badgeClass = '';
  let title = '';

  switch (status) {
    case 'Positive':
      IconComponent = CheckCircle2;
      badgeClass = 'bg-green-100 text-green-700 border-green-300';
      title = 'Positive Diagnosis';
      break;
    case 'Negative':
      IconComponent = XCircle;
      badgeClass = 'bg-red-100 text-red-700 border-red-300';
      title = 'Negative Diagnosis';
      break;
    case 'Inconclusive':
      IconComponent = HelpCircle;
      badgeClass = 'bg-yellow-100 text-yellow-700 border-yellow-300';
      title = 'Inconclusive Diagnosis';
      break;
    default: // Pending
      IconComponent = Clock;
      badgeClass = 'bg-gray-100 text-gray-700 border-gray-300';
      title = 'Awaiting Review';
      break;
  }

  return (
    <Card className="mt-6 bg-background/50">
      <CardHeader>
        <div className="flex items-center">
          <IconComponent className={`h-8 w-8 mr-3 ${badgeClass.split(' ')[1]}`} /> {/* Use text color from badgeClass */}
          <CardTitle className="font-headline text-xl">{title}</CardTitle>
        </div>
        <Badge variant="outline" className={`mt-1 ${badgeClass}`}>{status}</Badge>
      </CardHeader>
      {recommendation && (
        <CardContent>
          <h3 className="font-semibold text-lg mb-2 text-foreground">Technician's Recommendation:</h3>
          <p className="text-foreground whitespace-pre-wrap">{recommendation}</p>
          {technicianName && responseDate && (
            <p className="text-xs text-muted-foreground mt-3">
              By {technicianName} on {format(new Date(responseDate), "MMM d, yyyy")}
            </p>
          )}
        </CardContent>
      )}
      {status === 'Pending' && (
        <CardContent>
          <p className="text-muted-foreground">Your request is currently under review by a technician. You will be notified once a response is available.</p>
        </CardContent>
      )}
    </Card>
  );
};


export default function FarmerViewRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<AgriRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (requestId && user) {
      setIsLoading(true);
      fetchRequestById(requestId)
        .then(data => {
          if (data && data.farmerId === user.id) {
            setRequest(data);
          } else if (data) {
            setError("You are not authorized to view this request.");
          } else {
            setError("Request not found.");
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch request:", err);
          setError("Failed to load request details.");
          setIsLoading(false);
        });
    } else if (!requestId) {
        setError("Invalid request ID.");
        setIsLoading(false);
    }
  }, [requestId, user]);

  if (isLoading) {
    return (
      <PageWrapper allowedRoles={['farmer']}>
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-1/4 mb-6" /> {/* Back button */}
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-3/4 mb-2" /> {/* Title */}
              <Skeleton className="h-4 w-1/2" /> {/* Description */}
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-5 w-1/3" /> {/* Cassava Type */}
              <Skeleton className="h-5 w-1/3" /> {/* Submission Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-20 w-full" /></CardContent>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper allowedRoles={['farmer']}>
        <div className="text-center py-10">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-destructive">{error}</h2>
          <Button onClick={() => router.push(APP_ROUTES.FARMER_DASHBOARD)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!request) {
     // This case should ideally be covered by error state, but as a fallback:
    return (
      <PageWrapper allowedRoles={['farmer']}>
        <p>Request details could not be loaded.</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper allowedRoles={['farmer']}>
      <div className="max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className="mb-6 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Request Details</CardTitle>
            <CardDescription>ID: {request.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Microscope className="h-4 w-4 mr-2 text-primary" />Cassava Type</h3>
              <p className="text-lg text-foreground">{request.cassavaType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" />Submitted On</h3>
              <p className="text-lg text-foreground">{format(new Date(request.submissionDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center"><ImageIcon className="h-4 w-4 mr-2 text-primary" />Submitted Photos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {request.photoDataUris.map((uri, index) => (
                  <div key={index} className="rounded-lg overflow-hidden border border-border aspect-square bg-muted" data-ai-hint="cassava plant">
                    <Image
                      src={uri}
                      alt={`Submitted photo ${index + 1}`}
                      width={300}
                      height={300}
                      className="object-cover h-full w-full hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <StatusDisplay 
          status={request.status} 
          recommendation={request.recommendation}
          technicianName={request.technicianName}
          responseDate={request.responseDate}
        />
      </div>
    </PageWrapper>
  );
}
