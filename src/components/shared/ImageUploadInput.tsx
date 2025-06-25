
'use client';
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Loader2, AlertCircle, Camera, Image as ImageIcon } from 'lucide-react';
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
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const currentUploadTask = useRef<UploadTask | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const displayUrl = uploadPreview || currentImageUrl;

  useEffect(() => {
    // Cleanup effect to cancel upload on unmount
    return () => {
      if (currentUploadTask.current) {
        currentUploadTask.current.cancel();
      }
    };
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Crucial for mobile browsers: reset the input value immediately 
    // so selecting the same file again triggers the onChange event.
    if (event.target) {
        event.target.value = '';
    }

    if (!file) return;

    setError(null);
    setUploadProgress(0);
    setIsProcessing(true);
    let tempPreviewUrl = URL.createObjectURL(file);
    setUploadPreview(tempPreviewUrl);

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      const errorMsg = 'Tipo de arquivo inválido. Use JPEG, PNG, WEBP ou HEIC/HEIF.';
      toast({ title: 'Tipo de Arquivo Inválido', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsProcessing(false);
      setUploadPreview(null);
      URL.revokeObjectURL(tempPreviewUrl);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      const errorMsg = 'Arquivo muito grande (máximo 10MB).';
      toast({ title: 'Arquivo Muito Grande', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsProcessing(false);
      setUploadPreview(null);
      URL.revokeObjectURL(tempPreviewUrl);
      return;
    }

    if (!user || !user.id) {
      const errorMsg = 'Você precisa estar logado para fazer o upload.';
      toast({ title: 'Erro de Autenticação', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsProcessing(false);
      setUploadPreview(null);
      URL.revokeObjectURL(tempPreviewUrl);
      return;
    }

    try {
      const { uploadTask, promise: uploadPromise } = uploadImage(
        file,
        user.id,
        (percentage) => setUploadProgress(percentage)
      );
      currentUploadTask.current = uploadTask;

      const downloadURL = await uploadPromise;
      onUploadComplete(downloadURL);
      toast({ title: 'Upload Concluído', description: 'Imagem enviada com sucesso!' });
    } catch (uploadError: any) {
      console.error(`[ImageUploadInput ${id}] Upload failed:`, uploadError);
      const isCancelled = uploadError.code === 'storage/canceled';
      const errorMsg = isCancelled ? 'O upload foi cancelado.' : (uploadError.message || 'Ocorreu um erro ao enviar a imagem.');
      toast({
        title: isCancelled ? 'Upload Cancelado' : 'Falha no Upload',
        description: errorMsg,
        variant: isCancelled ? 'default' : 'destructive'
      });
      setError(errorMsg);
      onUploadComplete(null);
    } finally {
      if (tempPreviewUrl) {
          URL.revokeObjectURL(tempPreviewUrl);
      }
      setUploadPreview(null);
      setIsProcessing(false);
      currentUploadTask.current = null;
    }
  };
  
  const handleRemoveOrCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (currentUploadTask.current) {
      currentUploadTask.current.cancel();
    } else {
      setUploadPreview(null);
      setError(null);
      setUploadProgress(0);
      setIsProcessing(false);
      onUploadComplete(null);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      toast({ title: 'Imagem Removida' });
    }
  };

  const triggerCamera = () => cameraInputRef.current?.click();
  const triggerGallery = () => galleryInputRef.current?.click();
  
  const isDisabled = isProcessing;

  return (
    <>
      <div
        className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden transition-colors ${
          error ? 'border-destructive' : 'border-border'
        } ${isDisabled ? 'cursor-default' : 'cursor-wait'}`}
        aria-label={`Container de upload para ${id}`}
        aria-disabled={isDisabled}
      >
        {isProcessing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Enviando...</p>
            <div className="relative w-3/4 mt-1">
              <Progress value={uploadProgress} className="h-4" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary-foreground">
                {Math.round(uploadProgress)}%
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-2">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium">Erro</p>
            <p className="text-xs break-words">{error}</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); }}>Tentar novamente</Button>
          </div>
        ) : displayUrl ? (
          <Image src={displayUrl} alt={`Pré-visualização ${id}`} fill style={{objectFit: "contain"}} className="p-1" data-ai-hint="plant leaf symptom cassava" unoptimized={displayUrl.startsWith('https://placehold.co')} />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full p-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button type="button" onClick={triggerCamera} variant="outline" className="w-full sm:w-auto">
                <Camera className="mr-2 h-4 w-4" /> Câmera
              </Button>
              <Button type="button" onClick={triggerGallery} variant="outline" className="w-full sm:w-auto">
                <ImageIcon className="mr-2 h-4 w-4" /> Galeria
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Inputs */}
      <Input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        disabled={isProcessing}
        aria-hidden="true"
      />
      <Input
        ref={galleryInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileChange}
        disabled={isProcessing}
        aria-hidden="true"
      />

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
    </>
  );
}
