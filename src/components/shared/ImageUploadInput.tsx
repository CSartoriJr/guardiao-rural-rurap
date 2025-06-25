
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Immediately clear input to allow re-selecting the same file
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
      URL.revokeObjectURL(tempPreviewUrl);
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({ title: 'Imagem Removida' });
    }
  };

  const handleSourceSelect = (source: 'camera' | 'gallery') => {
    const input = fileInputRef.current;
    if (!input) return;

    if (source === 'camera') {
      input.setAttribute('capture', 'user');
    } else {
      input.removeAttribute('capture');
    }
    
    input.click();
    setIsSelectorOpen(false);
  };
  
  const isDisabled = isProcessing;

  return (
    <>
      <div className="space-y-2">
        <div
          onClick={() => !isDisabled && setIsSelectorOpen(true)}
          className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden transition-colors ${
            error ? 'border-destructive' : 'border-border hover:border-primary'
          } ${isDisabled ? 'cursor-default' : 'cursor-pointer'}`}
          aria-label={`Enviar imagem ${id}`}
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
              <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); setIsSelectorOpen(true); }}>Tentar novamente</Button>
            </div>
          ) : displayUrl ? (
            <Image src={displayUrl} alt={`Pré-visualização ${id}`} fill style={{objectFit: "contain"}} className="p-1" data-ai-hint="plant leaf symptom cassava" unoptimized={displayUrl.startsWith('https://placehold.co')} />
          ) : (
            <div className="text-center text-muted-foreground p-2">
              <UploadCloud className="mx-auto h-10 w-10" />
              <p className="mt-2 text-sm">Clique para enviar</p>
              <p className="text-xs">PNG, JPG, WEBP, HEIC/F (máx 10MB)</p>
            </div>
          )}
        </div>
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
        {(displayUrl && !isProcessing) && (
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
      
      <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Fonte da Imagem</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleSourceSelect('camera')}
            >
              <Camera className="h-8 w-8" />
              Câmera
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleSourceSelect('gallery')}
            >
              <ImageIcon className="h-8 w-8" />
              Galeria
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
