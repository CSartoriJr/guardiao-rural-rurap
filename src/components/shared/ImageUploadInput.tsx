
'use client';
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(0); // Initialize to 0 for immediate display
  const [currentUploadTask, setCurrentUploadTask] = useState<UploadTask | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [fileNameForDisplay, setFileNameForDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (currentImageUrl !== preview && !isProcessing) {
      setPreview(currentImageUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    const file = event.target.files?.[0];
    console.log(`[ImageUploadInput ${id}] handleFileChange triggered. File selected: ${file?.name}`);

    if (!file) {
      console.log(`[ImageUploadInput ${id}] No file selected.`);
      return;
    }

    setError(null);
    setUploadProgress(0); // Explicitly set to 0 to show progress bar
    setCurrentUploadTask(null);
    setPreview(null);
    onUploadComplete(null);
    setFileNameForDisplay(file.name);
    setIsProcessing(true);

    if (!user || !user.id) {
      console.error(`[ImageUploadInput ${id}] User not identified for upload of ${file.name}.`);
      toast({ title: 'Erro de Autenticação', description: 'Usuário não identificado para upload.', variant: 'destructive' });
      setError('Usuário não identificado.');
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({ title: 'Arquivo muito grande', description: 'Selecione uma imagem menor que 10MB.', variant: 'destructive' });
      setError('Arquivo muito grande (máx 10MB).');
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type.toLowerCase())) {
      toast({ title: 'Tipo de arquivo inválido', description: 'Envie JPEG, PNG, WEBP, HEIC ou HEIF.', variant: 'destructive' });
      setError('Tipo de arquivo inválido.');
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);

    try {
      const { uploadTask, promise: uploadPromise } = uploadImage(
        file,
        user.id,
        (percentage) => {
          console.log(`[ImageUploadInput ${id}] Progress Update Callback from service: ${percentage}% for ${file.name}`);
          setUploadProgress(percentage);
        }
      );
      setCurrentUploadTask(uploadTask);

      const downloadURL = await uploadPromise;
      if (preview === localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      setPreview(downloadURL);
      onUploadComplete(downloadURL);
      toast({ title: 'Upload Concluído', description: `Imagem ${fileNameForDisplay} enviada!` });
    } catch (uploadError: any) {
      if (preview === localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      let title = 'Falha no Upload';
      let description = uploadError.message || 'Ocorreu um erro ao enviar sua imagem. Tente novamente.';
      if (uploadError && uploadError.code === 'storage/canceled') {
        title = 'Upload Cancelado';
        description = `O envio de ${fileNameForDisplay} foi cancelado.`;
      }
      toast({ title, description, variant: title === 'Upload Cancelado' ? 'default' : 'destructive' });
      setError(description);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
    } finally {
      setIsProcessing(false);
      setCurrentUploadTask(null);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (currentUploadTask) currentUploadTask.cancel();
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    setUploadProgress(0); // Reset progress
    setIsProcessing(false);
    setCurrentUploadTask(null);
    onUploadComplete(null);
    setFileNameForDisplay(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast({ title: 'Imagem Removida', description: 'A imagem foi removida do campo.' });
  };

  const handleCancelUpload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (currentUploadTask) currentUploadTask.cancel();
    else {
      setIsProcessing(false);
      setUploadProgress(0); // Reset progress
      setError("Upload cancelado pelo usuário.");
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isProcessing && !preview && !error) {
        triggerFileInput();
    } else if (error && !isProcessing) {
        triggerFileInput(); // Allow re-try on error
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden transition-colors ${
          error ? 'border-destructive' : 'border-border hover:border-primary'
        } ${isProcessing || preview ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={handleContainerClick}
        role="button"
        tabIndex={isProcessing || preview ? -1 : 0}
        onKeyDown={(e) => !isProcessing && !preview && (e.key === 'Enter' || e.key === ' ') && triggerFileInput()}
        aria-label={`Enviar imagem ${id}`}
        aria-disabled={isProcessing}
      >
        {isProcessing && typeof uploadProgress === 'number' && uploadProgress < 100 && !error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Enviando {fileNameForDisplay ? `"${fileNameForDisplay}"` : 'imagem'}...</p>
            <div className="w-3/4 mt-1">
              <Progress value={uploadProgress} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          </div>
        ) : isProcessing && (uploadProgress === null || uploadProgress === 100) && !error ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">{uploadProgress === 100 ? 'Finalizando...' : `Preparando ${fileNameForDisplay ? `"${fileNameForDisplay}"` : 'imagem'}...`}</p>
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-2">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium">Erro:</p>
            <p className="text-xs break-words">{error}</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); setUploadProgress(0); triggerFileInput(); }}>Tentar novamente</Button>
          </div>
        ) : preview ? (
          <Image src={preview} alt={`Pré-visualização ${id}`} fill style={{objectFit: "contain"}} className="p-1" data-ai-hint="plant leaf symptom cassava" />
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
          accept="image/*" // Standard accept for images, browser handles options
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
      {isProcessing && typeof uploadProgress === 'number' && uploadProgress < 100 && currentUploadTask && (
        <Button variant="outline" size="sm" onClick={handleCancelUpload} className="w-full mt-2 text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Cancelar Upload
        </Button>
      )}
    </div>
  );
}
