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
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null); // Use ref instead of state for the upload task
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (currentImageUrl !== preview && !isProcessing) {
      setPreview(currentImageUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]);

  const handleContainerClick = () => {
    if (isProcessing || (preview && !error)) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (event.target) {
      event.target.value = '';
    }

    if (!file) {
      return;
    }

    setError(null);
    setUploadProgress(0);
    setIsProcessing(true);
    setPreview(URL.createObjectURL(file));

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
        const errorMsg = 'Tipo de arquivo inválido. Use JPEG, PNG, WEBP ou HEIC/HEIF.';
        toast({ title: 'Tipo de Arquivo Inválido', description: errorMsg, variant: 'destructive' });
        setError(errorMsg);
        setIsProcessing(false);
        setPreview(currentImageUrl || null);
        return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        const errorMsg = 'Arquivo muito grande (máximo 10MB).';
        toast({ title: 'Arquivo Muito Grande', description: errorMsg, variant: 'destructive' });
        setError(errorMsg);
        setIsProcessing(false);
        setPreview(currentImageUrl || null);
        return;
    }

    if (!user || !user.id) {
        const errorMsg = 'Você precisa estar logado para fazer o upload.';
        toast({ title: 'Erro de Autenticação', description: errorMsg, variant: 'destructive' });
        setError(errorMsg);
        setIsProcessing(false);
        setPreview(currentImageUrl || null);
        return;
    }
    
    try {
      const { uploadTask, promise: uploadPromise } = uploadImage(
        file,
        user.id,
        (percentage) => setUploadProgress(percentage)
      );
      uploadTaskRef.current = uploadTask; // Store task in ref

      const downloadURL = await uploadPromise;
      
      onUploadComplete(downloadURL);
      setPreview(downloadURL);
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
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);

    } finally {
      setIsProcessing(false);
      uploadTaskRef.current = null; // Clear the ref
    }
  };

  const handleRemoveOrCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel(); // This will trigger the catch block in handleFileChange
    } else {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setPreview(null);
      setError(null);
      setUploadProgress(0);
      setIsProcessing(false);
      onUploadComplete(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({ title: 'Imagem Removida' });
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden transition-colors ${
          error ? 'border-destructive' : 'border-border hover:border-primary'
        } ${isProcessing || (preview && !error) ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={handleContainerClick}
        role="button"
        tabIndex={isProcessing || (preview && !error) ? -1 : 0}
        onKeyDown={(e) => !isProcessing && !(preview && !error) && (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
        aria-label={`Enviar imagem ${id}`}
        aria-disabled={isProcessing || (!!preview && !error)}
      >
        {isProcessing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Enviando...</p>
            <div className="w-3/4 mt-1">
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-2">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium">Erro</p>
            <p className="text-xs break-words">{error}</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); fileInputRef.current?.click(); }}>Tentar novamente</Button>
          </div>
        ) : preview ? (
          <Image src={preview} alt={`Pré-visualização ${id}`} fill style={{objectFit: "contain"}} className="p-1" data-ai-hint="plant leaf symptom cassava" unoptimized={preview.startsWith('https://placehold.co')} />
        ) : (
          <div className="text-center text-muted-foreground p-2">
            <UploadCloud className="mx-auto h-10 w-10" />
            <p className="mt-2 text-sm">Clique para enviar</p>
            <p className="text-xs">PNG, JPG, WEBP, HEIC/F (máx 10MB)</p>
          </div>
        )}
        <Input
          type="file"
          id={id}
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={handleFileChange}
          disabled={isProcessing}
          aria-hidden="true"
        />
      </div>
      {(preview && !isProcessing) && (
        <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="w-full text-destructive hover:border-destructive/80 hover:bg-destructive/10">
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
