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
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const uploadTaskRef = useRef<UploadTask | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const displayUrl = currentImageUrl;

  useEffect(() => {
    // Cleanup effect: if the component unmounts, cancel any active upload.
    return () => {
      if (uploadTaskRef.current) {
        uploadTaskRef.current.cancel();
      }
    };
  }, []);

  const processAndUploadFile = async (file: File) => {
    // Reset component state for new upload
    setError(null);
    setUploadProgress(0);
    setIsUploading(true);

    // --- Validation ---
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      const errorMsg = 'Tipo inválido. Use JPEG, PNG, WEBP, ou HEIC.';
      toast({ title: 'Arquivo Inválido', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsUploading(false);
      return;
    }

    if (file.size > 15 * 1024 * 1024) { // 15MB limit
      const errorMsg = 'Arquivo muito grande (máximo 15MB).';
      toast({ title: 'Arquivo Muito Grande', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsUploading(false);
      return;
    }

    if (!user || !user.id) {
      const errorMsg = 'Você precisa estar logado para fazer o upload.';
      toast({ title: 'Erro de Autenticação', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsUploading(false);
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
        console.log(`[ImageUploadInput ${id}] Upload foi cancelado.`);
        setError('Upload cancelado.');
      } else {
        console.error(`[ImageUploadInput ${id}] Falha no upload:`, uploadError);
        const errorMsg = uploadError.message || 'Ocorreu um erro ao enviar a imagem.';
        setError(errorMsg);
        toast({ title: 'Falha no Upload', description: errorMsg, variant: 'destructive' });
      }
      onUploadComplete(null);
    } finally {
      setIsUploading(false);
      uploadTaskRef.current = null;
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return; // No file selected, do nothing.
    }
    
    // Process the file first.
    processAndUploadFile(file);

    // After processing, reset the input value. This is crucial.
    event.target.value = '';
  };
  
  const handleRemoveOrCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
    } else {
      setError(null);
      setUploadProgress(0);
      onUploadComplete(null);
      toast({ title: 'Imagem Removida' });
    }
  };
  
  return (
    <div className="flex w-full flex-col items-center justify-center">
      {/* Hidden inputs for camera and gallery */}
      <Input
        ref={cameraInputRef}
        type="file"
        id={`${id}-camera`}
        name={`${id}-camera`}
        className="hidden"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        disabled={isUploading}
        aria-hidden="true"
      />
      <Input
        ref={galleryInputRef}
        type="file"
        id={`${id}-gallery`}
        name={`${id}-gallery`}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        aria-hidden="true"
      />

      <div
        className={`relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/50 transition-colors ${
          error ? 'border-destructive' : 'border-border'
        }`}
      >
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Enviando...</p>
            <div className="w-3/4 mt-1 relative">
                <Progress value={uploadProgress} className="h-5" />
                <p className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-primary-foreground">{uploadProgress.toFixed(0)}%</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-2 text-center text-destructive">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium break-words">{error}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => { setError(null); cameraInputRef.current?.click(); }}>Câmera</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setError(null); galleryInputRef.current?.click(); }}>Galeria</Button>
            </div>
          </div>
        ) : displayUrl ? (
           <Image src={displayUrl} alt={`Pré-visualização ${id}`} fill style={{objectFit: "contain"}} className="p-1" data-ai-hint="plant leaf symptom cassava" unoptimized={displayUrl.startsWith('https://placehold.co')} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
             <p className="text-sm text-muted-foreground text-center">Anexar Imagem</p>
             <div className="flex w-full items-center justify-center gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => cameraInputRef.current?.click()} disabled={isUploading}>
                    <Camera className="mr-2 h-4 w-4" />
                    Câmera
                </Button>
                 <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => galleryInputRef.current?.click()} disabled={isUploading}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Galeria
                </Button>
             </div>
          </div>
        )}
      </div>

      {(displayUrl && !isUploading) && (
        <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="w-full text-destructive hover:border-destructive/80 hover:bg-destructive/10 mt-2">
          <X className="mr-2 h-4 w-4" /> Remover Imagem
        </Button>
      )}
      {isUploading && (
        <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="w-full mt-2 text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Cancelar Upload
        </Button>
      )}
    </div>
  );
}
