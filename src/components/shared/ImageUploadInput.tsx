
'use client';
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/services/imageUploadService';
import { useAuth } from '@/hooks/useAuth';
import imageCompression from 'browser-image-compression';

interface ImageUploadInputProps {
  onUploadComplete: (url: string | null) => void;
  id: string;
  currentImageUrl?: string | null;
}

export default function ImageUploadInput({ onUploadComplete, id, currentImageUrl }: ImageUploadInputProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (currentImageUrl !== preview) {
        setPreview(currentImageUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log(`[ImageUploadInput ${id}] handleFileChange triggered.`);
    const file = event.target.files?.[0];
    
    setError(null);

    if (!user || !user.id) {
      console.error(`[ImageUploadInput ${id}] User not identified for upload.`);
      toast({ title: 'Erro de Autenticação', description: 'Usuário não identificado para upload.', variant: 'destructive' });
      setError('Usuário não identificado.');
      onUploadComplete(null);
      setPreview(null);
      return;
    }

    if (file) {
      console.log(`[ImageUploadInput ${id}] File selected: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.type}`);

      if (file.size > 10 * 1024 * 1024) {
        console.warn(`[ImageUploadInput ${id}] File too large before compression: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        toast({ title: 'Arquivo muito grande', description: 'Selecione uma imagem menor que 10MB.', variant: 'destructive' });
        setError('Arquivo muito grande (máx 10MB).');
        onUploadComplete(null);
        setPreview(null);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        console.warn(`[ImageUploadInput ${id}] Invalid file type: ${file.type}`);
        toast({ title: 'Tipo de arquivo inválido', description: 'Envie JPEG, PNG, ou WEBP.', variant: 'destructive' });
        setError('Tipo de arquivo inválido.');
        onUploadComplete(null);
        setPreview(null);
        return;
      }

      setIsProcessing(true);
      setPreview(null);
      onUploadComplete(null);

      try {
        console.log(`[ImageUploadInput ${id}] Starting compression for file: ${file.name}`);
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressionStartTime = performance.now();
        const compressedFile = await imageCompression(file, options);
        const compressionEndTime = performance.now();
        console.log(`[ImageUploadInput ${id}] Compression took ${(compressionEndTime - compressionStartTime) / 1000} seconds.`);
        console.log(`[ImageUploadInput ${id}] Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB, Type: ${compressedFile.type}`);

        console.log(`[ImageUploadInput ${id}] Uploading compressed file...`);
        const downloadURL = await uploadImage(compressedFile, user.id);
        console.log(`[ImageUploadInput ${id}] Upload successful. URL: ${downloadURL}`);
        setPreview(downloadURL);
        onUploadComplete(downloadURL);
        toast({ title: 'Upload Concluído', description: 'Imagem enviada com sucesso!' });
      } catch (e: any) {
        console.error(`[ImageUploadInput ${id}] Error during image processing or upload:`, e);
        
        let userMessage = 'Ocorreu um erro desconhecido. Tente novamente.';
        // Check if the error object has a 'message' property (standard Error objects do)
        if (e && typeof e.message === 'string' && e.message.length > 0) {
          userMessage = e.message; // Use the message from the Error object (now standardized by imageUploadService)
        }
        
        // Specific check for compression related messages that might originate before calling the service
        if (userMessage.includes('Falha na Compressão') || userMessage.includes('Falha ao comprimir')) {
          // This message is already specific enough
        } else if (userMessage.includes('Permission denied') || userMessage.includes('permissão negada')) {
            userMessage = 'Falha no envio: permissão negada.';
        }


        toast({ title: 'Falha no Upload', description: userMessage, variant: 'destructive' });
        setError(userMessage);
        setPreview(null);
        onUploadComplete(null);
      } finally {
        setIsProcessing(false);
      }
    } else {
      console.log(`[ImageUploadInput ${id}] No file selected or event.target.files is null/empty.`);
      if (!currentImageUrl && !preview) { 
        setPreview(null);
        onUploadComplete(null);
      }
    }
  };

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    console.log(`[ImageUploadInput ${id}] handleRemoveImage called.`);
    setPreview(null);
    setError(null);
    onUploadComplete(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden transition-colors ${
          error ? 'border-destructive' : 'border-border hover:border-primary'
        } ${isProcessing ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        onKeyDown={(e) => !isProcessing && (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
        aria-label={`Enviar imagem ${id}`}
        aria-disabled={isProcessing}
      >
        {isProcessing ? (
          <div className="text-center text-muted-foreground p-2">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-2 text-sm">Processando...</p>
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-2">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium">Erro:</p>
            <p className="text-xs break-words">{error}</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); if (fileInputRef.current) fileInputRef.current.click(); }}>Tentar novamente</Button>
          </div>
        ) : preview ? (
          <Image src={preview} alt={`Pré-visualização ${id}`} fill style={{objectFit: "contain"}} className="p-1" />
        ) : (
          <div className="text-center text-muted-foreground p-2">
            <UploadCloud className="mx-auto h-10 w-10" />
            <p className="mt-2 text-sm">Clique ou arraste</p>
            <p className="text-xs">PNG, JPG, WEBP (10MB orig, ~1MB comp)</p>
          </div>
        )}
        <Input
          type="file"
          id={id}
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
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
    </div>
  );
}
