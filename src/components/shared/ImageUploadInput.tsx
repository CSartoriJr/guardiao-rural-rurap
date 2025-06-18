
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
    setPreview(currentImageUrl || null);
  }, [currentImageUrl]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!user || !user.id) {
      toast({ title: 'Erro de Autenticação', description: 'Usuário não identificado para upload.', variant: 'destructive' });
      setError('Usuário não identificado.');
      return;
    }

    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Initial check, compression handles more
        toast({ title: 'Arquivo muito grande', description: 'Por favor, envie uma imagem menor que 10MB.', variant: 'destructive' });
        setError('Arquivo muito grande (máx 10MB antes da compressão).');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({ title: 'Tipo de arquivo inválido', description: 'Envie JPEG, PNG, ou WEBP.', variant: 'destructive' });
        setError('Tipo de arquivo inválido.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setIsProcessing(true);
      try {
        console.log(`[ImageUploadInput] Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB, type: ${file.type}`);

        const options = {
          maxSizeMB: 1,          // Max final file size in MB
          maxWidthOrHeight: 1920, // Max width or height in pixels
          useWebWorker: true,    // Utiliza Web Workers para não bloquear a UI
          // Não especificar fileType ou initialQuality para deixar a biblioteca otimizar.
        };
        
        console.log(`[ImageUploadInput] Starting compression for file: ${file.name}`);
        const compressionStartTime = performance.now();
        const compressedFile = await imageCompression(file, options);
        const compressionEndTime = performance.now();
        console.log(`[ImageUploadInput] Compression took ${(compressionEndTime - compressionStartTime) / 1000} seconds.`);
        console.log(`[ImageUploadInput] Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB, type: ${compressedFile.type}`);

        const downloadURL = await uploadImage(compressedFile, user.id);
        setPreview(downloadURL);
        onUploadComplete(downloadURL);
        toast({ title: 'Upload Concluído', description: 'Imagem enviada com sucesso!' });
      } catch (uploadOrCompressionError: any) {
        console.error("[ImageUploadInput] Error during image processing or upload:", uploadOrCompressionError);
        let userMessage = 'Não foi possível processar ou enviar a imagem. Tente novamente.';
        if (uploadOrCompressionError.message.includes('Falha na Compressão') || uploadOrCompressionError.message.includes('Falha ao comprimir')) {
            userMessage = uploadOrCompressionError.message;
        } else if (uploadOrCompressionError.code) { // Firebase storage errors
             if (uploadOrCompressionError.code === 'storage/unauthorized') {
                userMessage = 'Falha no envio: permissão negada.';
            } else if (uploadOrCompressionError.code === 'storage/canceled') {
                userMessage = 'Falha no envio: upload cancelado.';
            }
        }
        
        toast({ title: 'Falha no Envio', description: userMessage, variant: 'destructive' });
        setError(userMessage);
        onUploadComplete(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (!currentImageUrl) {
        setPreview(null);
        onUploadComplete(null);
      }
    }
  };

  const handleRemoveImage = () => {
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
        onKeyDown={(e) => !isProcessing && e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label={`Enviar imagem ${id}`}
        aria-disabled={isProcessing}
      >
        {isProcessing ? (
          <div className="text-center text-muted-foreground">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-2 text-sm">Processando...</p>
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-2">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium">Erro:</p>
            <p className="text-xs break-words">{error}</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); fileInputRef.current?.click(); }}>Tentar novamente</Button>
          </div>
        ) : preview ? (
          <Image src={preview} alt={`Pré-visualização ${id}`} layout="fill" objectFit="contain" className="p-1" />
        ) : (
          <div className="text-center text-muted-foreground">
            <UploadCloud className="mx-auto h-12 w-12" />
            <p className="mt-2 text-sm">Clique ou arraste para enviar</p>
            <p className="text-xs">PNG, JPG, WEBP (max 1MB após compressão)</p>
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
