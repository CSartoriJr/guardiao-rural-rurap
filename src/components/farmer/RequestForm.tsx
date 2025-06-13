'use client';
import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // If needed, but prompt only asks for cassava type and photos
import ImageUploadInput from '@/components/shared/ImageUploadInput';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { AgriRequest } from '@/types'; // Ensure this path is correct
import { Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';


// Mock function to simulate saving the request
const saveRequest = async (requestData: Omit<AgriRequest, 'id' | 'submissionDate' | 'status' | 'farmerName'>): Promise<AgriRequest> => {
  console.log("Saving request:", requestData);
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
  const newRequest: AgriRequest = {
    ...requestData,
    id: `req${Date.now()}`,
    submissionDate: new Date().toISOString(),
    status: 'Pending',
    farmerName: requestData.farmerId, // In a real app, fetch user's name
  };
  // In a real app, you'd update a global state or re-fetch requests.
  // For mock, we can add to localStorage or a mock array if needed for persistence in demo.
  return newRequest;
};


const requestFormSchema = z.object({
  cassavaType: z.string().min(3, { message: 'Cassava type must be at least 3 characters.' }),
  photo1: z.string().nullable().refine(val => val !== null, { message: "Photo 1 is required." }),
  photo2: z.string().nullable().refine(val => val !== null, { message: "Photo 2 is required." }),
  photo3: z.string().nullable().refine(val => val !== null, { message: "Photo 3 is required." }),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function RequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      cassavaType: '',
      photo1: null,
      photo2: null,
      photo3: null,
    },
  });

  const onSubmit: SubmitHandler<RequestFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit a request.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const requestData = {
        farmerId: user.id,
        cassavaType: data.cassavaType,
        // Ensure non-null assertion is safe due to zod schema
        photoDataUris: [data.photo1!, data.photo2!, data.photo3!] as [string, string, string], 
      };
      const newRequest = await saveRequest(requestData);
      toast({
        title: 'Request Submitted!',
        description: `Your request for ${data.cassavaType} has been sent. ID: ${newRequest.id}`,
      });
      router.push(APP_ROUTES.FARMER_DASHBOARD); // Or to the specific request page: APP_ROUTES.FARMER_VIEW_REQUEST(newRequest.id)
    } catch (error) {
      console.error("Failed to submit request:", error);
      toast({ title: "Submission Failed", description: "Could not submit your request. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Submit New Request</CardTitle>
        <CardDescription>Please provide details about your cassava plant and upload three clear photos.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cassavaType">Type of Cassava</Label>
            <Controller
              name="cassavaType"
              control={control}
              render={({ field }) => <Input id="cassavaType" placeholder="e.g., TMS 30572, TME 419" {...field} />}
            />
            {errors.cassavaType && <p className="text-sm text-destructive">{errors.cassavaType.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="photo1">Photo 1</Label>
              <ImageUploadInput id="photo1" onImageUpload={(uri) => setValue('photo1', uri, { shouldValidate: true })} />
              {errors.photo1 && <p className="text-sm text-destructive mt-1">{errors.photo1.message}</p>}
            </div>
            <div>
              <Label htmlFor="photo2">Photo 2</Label>
              <ImageUploadInput id="photo2" onImageUpload={(uri) => setValue('photo2', uri, { shouldValidate: true })} />
              {errors.photo2 && <p className="text-sm text-destructive mt-1">{errors.photo2.message}</p>}
            </div>
            <div>
              <Label htmlFor="photo3">Photo 3</Label>
              <ImageUploadInput id="photo3" onImageUpload={(uri) => setValue('photo3', uri, { shouldValidate: true })} />
              {errors.photo3 && <p className="text-sm text-destructive mt-1">{errors.photo3.message}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Request
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
