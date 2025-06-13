'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import PageWrapper from '@/components/shared/PageWrapper';
import ResponseForm from '@/components/technician/ResponseForm';
import type { AgriRequest } from '@/types';
import { mockRequests } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, CalendarDays, Microscope, Image as ImageIcon, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';

// Mock function to fetch a single request for technician
const fetchRequestByIdForTechnician = async (requestId: string): Promise<AgriRequest | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Technicians can view any pending request or requests they responded to.
  // For simplicity, allow viewing any request by ID for now.
  return mockRequests.find(req => req.id === requestId);
};


export default function TechnicianViewRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth(); // Technician user
  const [request, setRequest] = useState<AgriRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (requestId && user) {
      setIsLoading(true);
      fetchRequestByIdForTechnician(requestId)
        .then(data => {
          if (data) {
            // Optionally, pre-fetch AI suggestion if not already done or if request is still pending
            // This logic could be more complex, e.g., store AI suggestion in request object
            // For now, ResponseForm will handle AI fetching on demand
            setRequest(data);
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
       <PageWrapper allowedRoles={['technician']}>
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-1/4 mb-6" /> {/* Back button */}
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-3/4 mb-2" /> {/* Title */}
              <Skeleton className="h-4 w-1/2" /> {/* Description */}
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-5 w-1/3" /> {/* Farmer */}
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
            <CardContent><Skeleton className="h-40 w-full" /></CardContent> {/* For ResponseForm placeholder */}
          </Card>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
     return (
      <PageWrapper allowedRoles={['technician']}>
        <div className="text-center py-10">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-destructive">{error}</h2>
          <Button onClick={() => router.push(APP_ROUTES.TECHNICIAN_DASHBOARD)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!request) {
    return (
      <PageWrapper allowedRoles={['technician']}>
        <p>Request details could not be loaded.</p>
      </PageWrapper>
    );
  }
  
  return (
    <PageWrapper allowedRoles={['technician']}>
      <div className="max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className="mb-6 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Farmer Request Details</CardTitle>
            <CardDescription>ID: {request.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><User className="h-4 w-4 mr-2 text-primary" />Farmer</h3>
              <p className="text-lg text-foreground">{request.farmerName || request.farmerId}</p>
            </div>
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

        {/* Conditionally render ResponseForm or display existing response */}
        {request.status === 'Pending' ? (
          <ResponseForm request={request} />
        ) : (
          <Card className="mt-6 bg-card/80">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Response Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Status:</strong> {request.status}</p>
              <p className="mt-2"><strong>Recommendation:</strong></p>
              <p className="whitespace-pre-wrap bg-muted p-3 rounded-md mt-1">{request.recommendation}</p>
              {request.technicianName && request.responseDate && (
                <p className="text-xs text-muted-foreground mt-3">
                  By You ({request.technicianName}) on {format(new Date(request.responseDate), "MMM d, yyyy")}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
