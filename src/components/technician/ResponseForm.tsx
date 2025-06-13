'use client';
import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { AgriRequest, User, RequestStatus } from '@/types';
import { generateRecommendation } from '@/ai/flows/generate-recommendation-from-image';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';

// Mock function to simulate updating the request
const updateRequestStatus = async (
  requestId: string,
  technicianId: string,
  technicianName: string,
  recommendation: string,
  status: RequestStatus
): Promise<AgriRequest> => {
  console.log("Updating request:", { requestId, technicianId, recommendation, status });
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
  
  // In a real app, find and update the request in the backend.
  // For mock, we'd find in mockRequests and update it.
  const existingRequest = mockRequests.find(r => r.id === requestId);
  if (!existingRequest) throw new Error("Request not found for update");

  const updatedRequest: AgriRequest = {
    ...existingRequest,
    technicianId,
    technicianName,
    recommendation,
    status,
    responseDate: new Date().toISOString(),
  };
  // Update mockRequests array
  const index = mockRequests.findIndex(r => r.id === requestId);
  if (index !== -1) mockRequests[index] = updatedRequest;
  
  return updatedRequest;
};

const responseFormSchema = z.object({
  recommendation: z.string().min(10, { message: 'Recommendation must be at least 10 characters.' }),
  status: z.enum(['Positive', 'Negative', 'Inconclusive'], { required_error: "Status is required." }),
});

type ResponseFormValues = z.infer<typeof responseFormSchema>;

interface ResponseFormProps {
  request: AgriRequest;
}

export default function ResponseForm({ request }: ResponseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { toast } = useToast();
  const { user: technicianUser } = useAuth(); // Assuming this is the technician
  const router = useRouter();

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ResponseFormValues>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      recommendation: request.aiSuggestedRecommendation || '',
      status: request.status !== 'Pending' ? request.status : undefined,
    },
  });

  const currentRecommendation = watch('recommendation');

  const handleGetAiSuggestion = async () => {
    setIsAiLoading(true);
    try {
      const aiInput = {
        cassavaType: request.cassavaType,
        photoDataUri1: request.photoDataUris[0],
        photoDataUri2: request.photoDataUris[1],
        photoDataUri3: request.photoDataUris[2],
      };
      const result = await generateRecommendation(aiInput);
      setValue('recommendation', result.recommendation, { shouldValidate: true });
      toast({ title: 'AI Suggestion Generated!', description: 'Recommendation has been updated.' });
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({ title: "AI Error", description: "Could not generate AI suggestion.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const onSubmit: SubmitHandler<ResponseFormValues> = async (data) => {
    if (!technicianUser) {
      toast({ title: "Error", description: "Technician not logged in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateRequestStatus(request.id, technicianUser.id, technicianUser.name, data.recommendation, data.status);
      toast({
        title: 'Response Submitted!',
        description: `Your response for request ID ${request.id} has been saved.`,
      });
      router.push(APP_ROUTES.TECHNICIAN_DASHBOARD);
    } catch (error) {
      console.error("Failed to submit response:", error);
      toast({ title: "Submission Failed", description: "Could not submit response. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Submit Your Recommendation</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div>
            <Button type="button" variant="outline" onClick={handleGetAiSuggestion} disabled={isAiLoading || isSubmitting} className="mb-2 w-full sm:w-auto">
              {isAiLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
              )}
              Get AI Suggestion
            </Button>
            <Label htmlFor="recommendation">Recommendation Text</Label>
            <Controller
              name="recommendation"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="recommendation"
                  rows={8}
                  placeholder="Provide detailed recommendations based on the images and cassava type..."
                  {...field}
                  className="mt-1"
                />
              )}
            />
            {errors.recommendation && <p className="text-sm text-destructive mt-1">{errors.recommendation.message}</p>}
          </div>

          <div>
            <Label>Diagnosis Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mt-1"
                >
                  {(['Positive', 'Negative', 'Inconclusive'] as RequestStatus[]).map((statusVal) => (
                    <div key={statusVal} className="flex items-center space-x-2">
                      <RadioGroupItem value={statusVal} id={`status-${statusVal.toLowerCase()}`} />
                      <Label htmlFor={`status-${statusVal.toLowerCase()}`} className="font-normal">{statusVal}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
            {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting || isAiLoading}>
             {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Response
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
