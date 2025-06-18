
'use client';
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Loader2, AlertCircle, Camera, Image as ImageIconLucide, Ban } from 'lucide-react'; // Renamed ImageIcon to ImageIconLucide
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/services/imageUploadService';
import { useAuth } from '@/hooks/useAuth';
import type { UploadTask } from 'firebase/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImageUploadInputProps {
  onUploadComplete: (url: string | null) => void;
  id: string;
  currentImageUrl?: string | null;
}

export default function ImageUploadInput({ onUploadComplete, id, currentImageUrl }: ImageUploadInputProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Covers compression (if any) and upload
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [currentUploadTask, setCurrentUploadTask] = useState<UploadTask | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [fileNameForDisplay, setFileNameForDisplay] = useState<string | null>(null);


  useEffect(() => {
    if (currentImageUrl !== preview) {
        setPreview(currentImageUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    console.log(`[ImageUploadInput ${id}] handleFileChange triggered.`);
    const file = event.target.files?.[0];
    
    // Reset input value to allow selecting the same file again if needed.
    // Also clear capture attribute.
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.removeAttribute('capture');
    }

    setError(null);
    setUploadProgress(null);
    setCurrentUploadTask(null);
    setFileNameForDisplay(null);

    if (!user || !user.id) {
      console.error(`[ImageUploadInput ${id}] User not identified for upload.`);
      toast({ title: 'Erro de Autenticação', description: 'Usuário não identificado para upload.', variant: 'destructive' });
      setError('Usuário não identificado.');
      setPreview(currentImageUrl || null); // Revert to original if user was logged out mid-process
      onUploadComplete(currentImageUrl || null);
      return;
    }

    if (file) {
      setFileNameForDisplay(file.name);
      console.log(`[ImageUploadInput ${id}] File selected: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.type}`);

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.warn(`[ImageUploadInput ${id}] File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        toast({ title: 'Arquivo muito grande', description: 'Selecione uma imagem menor que 10MB.', variant: 'destructive' });
        setError('Arquivo muito grande (máx 10MB).');
        setPreview(currentImageUrl || null); // Revert to original
        onUploadComplete(currentImageUrl || null);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type.toLowerCase())) {
        console.warn(`[ImageUploadInput ${id}] Invalid file type: ${file.type}`);
        toast({ title: 'Tipo de arquivo inválido', description: 'Envie JPEG, PNG, WEBP, HEIC ou HEIF.', variant: 'destructive' });
        setError('Tipo de arquivo inválido.');
        setPreview(currentImageUrl || null); // Revert to original
        onUploadComplete(currentImageUrl || null);
        return;
      }

      setIsProcessing(true);
      setPreview(URL.createObjectURL(file)); // Show local preview immediately
      onUploadComplete(null); // Clear any previous successfully uploaded URL for this input

      try {
        console.log(`[ImageUploadInput ${id}] Starting upload for file: ${file.name}`);
        const uploadStartTime = Date.now();
        
        const { uploadTask, promise: uploadPromise } = uploadImage(file, user.id, (percentage) => {
          setUploadProgress(percentage);
        });
        setCurrentUploadTask(uploadTask); // Store the task for potential cancellation

        const downloadURL = await uploadPromise;
        
        const uploadEndTime = Date.now();
        console.log(`[ImageUploadInput ${id}] Upload for ${file.name} took ${(uploadEndTime - uploadStartTime) / 1000} seconds.`);
        console.log(`[ImageUploadInput ${id}] Upload successful. URL: ${downloadURL}`);
        
        setPreview(downloadURL); // Update preview to final Firebase URL
        onUploadComplete(downloadURL);
        toast({ title: 'Upload Concluído', description: `Imagem ${file.name} enviada!` });
        setFileNameForDisplay(null); // Clear filename after successful upload
      } catch (uploadError: any) {
        console.error(`[ImageUploadInput ${id}] Error caught by component's catch block for file ${file.name}:`, uploadError);
        
        let title = 'Falha no Upload';
        let description = 'Ocorreu um erro ao enviar sua imagem. Tente novamente.';

        if (uploadError && uploadError.code === 'storage/canceled') {
          title = 'Upload Cancelado';
          description = `O envio de ${file.name} foi cancelado.`;
        } else if (uploadError && uploadError.message) {
          description = uploadError.message;
        }
        
        toast({ title, description, variant: title === 'Upload Cancelado' ? 'default' : 'destructive' });
        setError(description);
        setPreview(currentImageUrl || null); // Revert preview to original image if it exists, otherwise null
        onUploadComplete(currentImageUrl || null); // Revert to original URL
        setFileNameForDisplay(null); // Clear filename on error
      } finally {
        setIsProcessing(false);
        setUploadProgress(null);
        setCurrentUploadTask(null);
      }
    } else {
      console.log(`[ImageUploadInput ${id}] No file selected from dialog.`);
      if (error && !currentImageUrl) { // If there was an error for this specific input and user cancels, clear the error.
        setError(null);
      }
      // Do not clear preview/onUploadComplete if it was already set from currentImageUrl or previous successful upload
    }
  };

  const triggerFileInput = (captureMode?: 'environment' | 'user') => {
    if (fileInputRef.current) {
      if (captureMode) {
        fileInputRef.current.setAttribute('capture', captureMode);
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
    setIsChoiceDialogOpen(false);
  };

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    console.log(`[ImageUploadInput ${id}] handleRemoveImage called.`);
    if (currentUploadTask) {
      console.log(`[ImageUploadInput ${id}] Cancelling ongoing upload task before removing.`);
      currentUploadTask.cancel(); // This will trigger the error callback in the service
    }
    // Resetting states, onUploadComplete will be handled by the cancellation error flow
    setPreview(null);
    setError(null);
    setUploadProgress(null);
    setIsProcessing(false);
    setCurrentUploadTask(null);
    onUploadComplete(null); // Explicitly notify parent that image is removed
    setFileNameForDisplay(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
  };
  
  const handleCancelUpload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (currentUploadTask) {
      console.log(`[ImageUploadInput ${id}] User initiated cancel upload for task.`);
      currentUploadTask.cancel();
      // The error/cancellation is handled by the uploadTask.on error callback,
      // which will then update state via the catch block in handleFileChange.
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isProcessing && !preview && !error) {
        setIsChoiceDialogOpen(true);
    } else if (error && !isProcessing) { // Allow retrying if there's an error
        setIsChoiceDialogOpen(true); 
    }
    // If preview exists, clicking container does nothing (remove button is separate)
  };

  return (
    <div className="space-y-2">
      <AlertDialog open={isChoiceDialogOpen} onOpenChange={setIsChoiceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escolher Fonte da Imagem</AlertDialogTitle>
            <AlertDialogDescription>
              Você gostaria de selecionar uma imagem da sua galeria ou tirar uma nova foto com a câmera?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={(e) => { e.stopPropagation(); fileInputRef.current?.removeAttribute('capture'); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
              className="bg-primary hover:bg-primary/90"
            >
              <ImageIconLucide className="mr-2 h-4 w-4" />
              Galeria
            </AlertDialogAction>
            <AlertDialogAction
              onClick={(e) => { e.stopPropagation(); triggerFileInput('environment'); }}
              className="bg-accent hover:bg-accent/90"
            >
              <Camera className="mr-2 h-4 w-4" />
              Câmera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden transition-colors ${
          error ? 'border-destructive' : 'border-border hover:border-primary'
        } ${isProcessing || preview ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={handleContainerClick}
        role="button"
        tabIndex={isProcessing || preview ? -1 : 0}
        onKeyDown={(e) => !isProcessing && !preview && (e.key === 'Enter' || e.key === ' ') && setIsChoiceDialogOpen(true)}
        aria-label={`Enviar imagem ${id}`}
        aria-disabled={isProcessing}
      >
        {isProcessing && uploadProgress === null && !error ? ( 
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Processando {fileNameForDisplay ? `"${fileNameForDisplay}"` : 'imagem'}...</p>
          </div>
        ) : isProcessing && uploadProgress !== null && !error ? ( 
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Enviando {fileNameForDisplay ? `"${fileNameForDisplay}"` : 'imagem'}...</p>
            <div className="w-3/4 mt-1">
              <Progress value={uploadProgress} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-2">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium">Erro:</p>
            <p className="text-xs break-words">{error}</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); setUploadProgress(null); setIsChoiceDialogOpen(true); }}>Tentar novamente</Button>
          </div>
        ) : preview ? (
          <Image src={preview} alt={`Pré-visualização ${id}`} fill style={{objectFit: "contain"}} className="p-1" data-ai-hint="plant leaf symptom" />
        ) : (
          <div className="text-center text-muted-foreground p-2">
            <UploadCloud className="mx-auto h-10 w-10" />
            <p className="mt-2 text-sm">Clique para enviar</p>
            <p className="text-xs">PNG, JPG, WEBP, HEIC/F (máx 10MB)</p>
          </div>
        )}
        <Input
          type="file"
          id={id} // Should be unique if multiple instances on one page
          ref={fileInputRef}
          className="hidden"
          accept="image/*" // General image/* for file dialog, specific types checked in code
          onChange={handleFileChange}
          disabled={isProcessing}
          aria-hidden="true" 
        />
      </div>
      {preview && !isProcessing && !error && (
        <Button variant="outline" size="sm" onClick={handleRemoveImage} className="w-full text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Remover Imagem
        </Button>
      )}
      {isProcessing && uploadProgress !== null && uploadProgress < 100 && currentUploadTask && (
        <Button variant="outline" size="sm" onClick={handleCancelUpload} className="w-full mt-2 text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <Ban className="mr-2 h-4 w-4" /> Cancelar Upload
        </Button>
      )}
    </div>
  );
}
