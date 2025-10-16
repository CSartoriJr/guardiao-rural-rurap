'use client';
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, FileImage, X, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/services/imageUploadService';
import type { UploadTask } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

interface ImageUploadInputProps {
  onUploadComplete: (url: string | null) => void;
  id: string;
  currentImageUrl?: string | null;
  uploadPath: string;
}

export default function ImageUploadInput({ onUploadComplete, id, currentImageUrl, uploadPath }: ImageUploadInputProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null);
  
  const { toast } = useToast();
  
  const displayUrl = currentImageUrl;

  useEffect(() => {
    // Cleanup function to cancel ongoing upload if the component unmounts.
    return () => {
      if (uploadTaskRef.current) {
        console.log(`[ImageUploadInput] Component unmounting, cancelling upload for ${id}`);
        uploadTaskRef.current.cancel();
      }
    };
  }, [id]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // Reset input to allow re-selecting the same file

    if (!file) {
      return;
    }
    
    setError(null);
    setUploadProgress(0);
    
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      const errorMsg = 'Tipo inválido. Use JPEG, PNG, WEBP, ou HEIC.';
      toast({ title: 'Arquivo Inválido', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      return;
    }

    if (file.size > 15 * 1024 * 1024) { // 15MB limit
      const errorMsg = 'Arquivo muito grande (máximo 15MB).';
      toast({ title: 'Arquivo Muito Grande', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      return;
    }

    if (!uploadPath) {
      const errorMsg = 'O caminho de destino para o upload não foi especificado. Selecione um agricultor primeiro.';
      toast({ title: 'Erro de Configuração', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      return;
    }

    setIsUploading(true);

    let fileToUpload = file;
    // Comprimir imagem se for maior que 1MB
    if (file.size > 1 * 1024 * 1024) {
      try {
        toast({ title: 'Comprimindo imagem...', description: 'A imagem é grande e será otimizada antes do envio.' });
        console.log(`[ImageUpload] Attempting to compress image. Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/jpeg', // Sempre converte para JPEG para consistência e tamanho
        };
        const compressedBlob = await imageCompression(file, options);
        fileToUpload = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".jpeg"), {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        console.log(`[ImageUpload] Compression successful. New size: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
      } catch (compressionError) {
        console.warn('[ImageUpload] Image compression failed, falling back to original file. Error:', compressionError);
        toast({ 
          title: 'Compressão Falhou', 
          description: 'Enviando a imagem original. Isso pode levar mais tempo.',
          variant: 'default'
        });
        fileToUpload = file; // Fallback to original file
      }
    }


    try {
      console.log(`[ImageUploadInput] Passing file to uploadImage service for path: ${uploadPath}. File size: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
      const { uploadTask, promise: uploadPromise } = uploadImage(
        fileToUpload,
        uploadPath,
        (percentage) => {
            setUploadProgress(percentage);
        }
      );
      
      uploadTaskRef.current = uploadTask;

      const downloadURL = await uploadPromise;
      
      onUploadComplete(downloadURL);
      toast({ title: 'Upload Concluído', description: 'Sua imagem foi enviada.' });

    } catch (uploadError: any) {
      const isCancelled = uploadError.code === 'storage/canceled';
      if (isCancelled) {
        setError('Upload cancelado.');
        console.log('[ImageUploadInput] Upload was cancelled.');
      } else {
        const errorMsg = uploadError.message || 'Ocorreu um erro ao enviar a imagem.';
        setError(errorMsg);
        toast({ title: 'Falha no Upload', description: errorMsg, variant: 'destructive' });
        console.error('[ImageUploadInput] Upload failed with error:', uploadError);
      }
      onUploadComplete(null);
    } finally {
      setIsUploading(false);
      uploadTaskRef.current = null;
    }
  };
  
  const handleRemoveOrCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (uploadTaskRef.current) {
      console.log('[ImageUploadInput] User cancelled upload.');
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
      <Input
        ref={fileInputRef}
        type="file"
        id={id}
        name={id}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading || !uploadPath}
        aria-hidden="true"
      />
      <Input
        ref={cameraInputRef}
        type="file"
        id={`${id}-camera`}
        name={`${id}-camera`}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={isUploading || !uploadPath}
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
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { setError(null); fileInputRef.current?.click(); }}>
              Tentar Novamente
            </Button>
          </div>
        ) : displayUrl ? (
           <Image src={displayUrl} alt={`Pré-visualização ${id}`} fill style={{objectFit: "contain"}} className="p-1" data-ai-hint="plant leaf symptom cassava" unoptimized={displayUrl.startsWith('https://placehold.co')} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => cameraInputRef.current?.click()} disabled={isUploading || !uploadPath}>
              <Camera className="mr-2 h-4 w-4" />
              Tirar Foto
            </Button>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isUploading || !uploadPath}>
              <FileImage className="mr-2 h-4 w-4" />
              Escolher da Galeria
            </Button>
             <p className="text-xs text-muted-foreground mt-2 text-center">
              Para melhores resultados, tire a foto com o celular na horizontal.
            </p>
          </div>
        )}
      </div>

      {(displayUrl && !isUploading) && (
        <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="text-destructive hover:border-destructive/80 hover:bg-destructive/10 mt-2">
          <X className="mr-2 h-4 w-4" /> Remover Imagem
        </Button>
      )}
      {isUploading && (
        <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="mt-2 text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Cancelar Upload
        </Button>
      )}
    </div>
  );
}
