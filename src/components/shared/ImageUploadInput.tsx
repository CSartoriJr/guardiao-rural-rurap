
'use client';
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/services/imageUploadService';
import { useAuth } from '@/hooks/useAuth';
import type { UploadTask } from 'firebase/storage';

interface ImageUploadInputProps {
  onUploadComplete: (url: string | null) => void;
  id: string;
  currentImageUrl?: string | null;
}

export default function ImageUploadInput({ onUploadComplete, id, currentImageUrl }: ImageUploadInputProps) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const uploadTaskRef = useRef<UploadTask | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // The URL to display is always the one from props (already uploaded).
  // This simplifies state and prevents sync issues.
  const displayUrl = currentImageUrl;

  useEffect(() => {
    // Cleanup effect: if the component unmounts, cancel any active upload.
    return () => {
      if (uploadTaskRef.current) {
        console.log(`[ImageUploadInput ${id}] Unmounting, canceling upload task.`);
        uploadTaskRef.current.cancel();
      }
    };
  }, [id]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Critically, reset the input value so the same file can be selected again.
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!file) return;

    // Reset component state for new upload
    setError(null);
    setUploadProgress(0);
    setIsProcessing(true);

    // --- Validation ---
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      const errorMsg = 'Tipo inválido. Use JPEG, PNG, WEBP, ou HEIC.';
      toast({ title: 'Arquivo Inválido', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsProcessing(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      const errorMsg = 'Arquivo muito grande (máximo 10MB).';
      toast({ title: 'Arquivo Muito Grande', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsProcessing(false);
      return;
    }

    if (!user || !user.id) {
      const errorMsg = 'Você precisa estar logado para fazer o upload.';
      toast({ title: 'Erro de Autenticação', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsProcessing(false);
      return;
    }

    // --- Upload ---
    try {
      const { uploadTask, promise: uploadPromise } = uploadImage(
        file,
        user.id,
        (percentage) => setUploadProgress(percentage)
      );
      uploadTaskRef.current = uploadTask;

      const downloadURL = await uploadPromise;
      onUploadComplete(downloadURL);
      toast({ title: 'Upload Concluído', description: 'Sua imagem foi enviada.' });
    } catch (uploadError: any) {
      const isCancelled = uploadError.code === 'storage/canceled';
      if (isCancelled) {
        console.log(`[ImageUploadInput ${id}] Upload was cancelled.`);
        setError('Upload cancelado.');
      } else {
        console.error(`[ImageUploadInput ${id}] Upload failed:`, uploadError);
        const errorMsg = uploadError.message || 'Ocorreu um erro ao enviar a imagem.';
        setError(errorMsg);
        toast({ title: 'Falha no Upload', description: errorMsg, variant: 'destructive' });
      }
      onUploadComplete(null);
    } finally {
      setIsProcessing(false);
      uploadTaskRef.current = null;
    }
  };
  
  const handleRemoveOrCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent triggering the file input
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
    } else {
      setError(null);
      setUploadProgress(0);
      onUploadComplete(null);
      toast({ title: 'Imagem Removida' });
    }
  };

  const triggerFileInput = () => {
    // Clear any previous error before trying again
    if (isDisabled) return;
    setError(null);
    fileInputRef.current?.click();
  };
  
  const isDisabled = isProcessing;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div
        onClick={triggerFileInput}
        className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden transition-colors ${
          error ? 'border-destructive' : 'border-border'
        } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        aria-disabled={isDisabled}
      >
        {/* Input is always present but hidden */}
        <Input
          ref={fileInputRef}
          type="file"
          id={id}
          name={id}
          className="hidden"
          accept="image/*" // Let the OS decide how to handle this
          onChange={handleFileChange}
          disabled={isDisabled}
          aria-hidden="true"
        />

        {isProcessing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Enviando...</p>
            <Progress value={uploadProgress} className="w-3/4 mt-1" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-2">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium break-words">{error}</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}>Tentar novamente</Button>
          </div>
        ) : displayUrl ? (
           <Image src={displayUrl} alt={`Pré-visualização ${id}`} fill style={{objectFit: "contain"}} className="p-1" data-ai-hint="plant leaf symptom cassava" unoptimized={displayUrl.startsWith('https://placehold.co')} />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mt-2">Clique para Anexar</span>
          </div>
        )}
      </div>

      {(displayUrl && !isProcessing) && (
        <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="w-full text-destructive hover:border-destructive/80 hover:bg-destructive/10 mt-2">
          <X className="mr-2 h-4 w-4" /> Remover Imagem
        </Button>
      )}
      {isProcessing && (
        <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="w-full mt-2 text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Cancelar Upload
        </Button>
      )}
    </div>
  );
}
