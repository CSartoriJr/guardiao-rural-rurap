
'use client';
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction, // Não usado, mas mantendo para referência caso necessário
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, UploadCloud, Loader2, AlertCircle, Camera, Image as ImageIconLucide } from 'lucide-react';
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
  const [currentUploadTask, setCurrentUploadTask] = useState<UploadTask | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [fileNameForDisplay, setFileNameForDisplay] = useState<string | null>(null);
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);

  useEffect(() => {
    if (currentImageUrl !== preview && !isProcessing) {
      setPreview(currentImageUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]);

  const resetInputAndCaptureState = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Crucial para permitir re-seleção do mesmo arquivo
      fileInputRef.current.removeAttribute('capture');
      console.log(`[ImageUploadInput ${id}] Input value and capture attribute reset.`);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log(`[ImageUploadInput ${id}] handleFileChange. File: ${file?.name}`);

    if (!file) {
      console.log(`[ImageUploadInput ${id}] No file selected or selection cancelled by user.`);
      resetInputAndCaptureState();
      return;
    }

    setError(null);
    setUploadProgress(0);
    setCurrentUploadTask(null);
    setPreview(null);
    onUploadComplete(null); // Informa o pai que a imagem anterior (se houver) foi removida
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
      resetInputAndCaptureState();
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({ title: 'Arquivo muito grande', description: 'Selecione uma imagem menor que 10MB.', variant: 'destructive' });
      setError('Arquivo muito grande (máx 10MB).');
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
      resetInputAndCaptureState();
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type.toLowerCase())) {
      toast({ title: 'Tipo de arquivo inválido', description: 'Envie JPEG, PNG, WEBP, HEIC ou HEIF.', variant: 'destructive' });
      setError('Tipo de arquivo inválido.');
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
      resetInputAndCaptureState();
      return;
    }
    
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);
    setUploadProgress(0);

    try {
      console.log(`[ImageUploadInput ${id}] Uploading original file: ${file.name}`);
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
      console.log(`[ImageUploadInput ${id}] Upload successful. URL: ${downloadURL}`);
      if (preview === localPreviewUrl) { // Verifica se o preview ainda é o local antes de revogar
         URL.revokeObjectURL(localPreviewUrl);
      }
      setPreview(downloadURL);
      onUploadComplete(downloadURL);
      toast({ title: 'Upload Concluído', description: `Imagem ${fileNameForDisplay} enviada!` });
    } catch (uploadError: any) {
      console.error(`[ImageUploadInput ${id}] Error during image upload. Message: ${uploadError.message}`, uploadError);
      if (preview === localPreviewUrl) {
         URL.revokeObjectURL(localPreviewUrl);
      }
      
      let title = 'Falha no Upload';
      let description = uploadError.message || 'Ocorreu um erro ao enviar sua imagem. Tente novamente.';
      
      if (uploadError && uploadError.code === 'storage/canceled') {
        title = 'Upload Cancelado';
        description = `O envio de ${fileNameForDisplay || 'imagem'} foi cancelado.`;
      }
      
      toast({ title, description, variant: title === 'Upload Cancelado' ? 'default' : 'destructive' });
      setError(description);
      setPreview(currentImageUrl || null); 
      onUploadComplete(currentImageUrl || null);
    } finally {
      setIsProcessing(false);
      setCurrentUploadTask(null);
      resetInputAndCaptureState(); // Garante que o input e o atributo 'capture' sejam resetados.
    }
  };

  const triggerFileInput = (useCamera: boolean) => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Limpa o valor para permitir a seleção do mesmo arquivo
      if (useCamera) {
        console.log(`[ImageUploadInput ${id}] Setting capture='environment'`);
        fileInputRef.current.setAttribute('capture', 'environment');
      } else {
        console.log(`[ImageUploadInput ${id}] Removing capture attribute`);
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
    setIsChoiceDialogOpen(false);
  };


  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (currentUploadTask) {
      console.log(`[ImageUploadInput ${id}] Cancelling active upload task due to remove image.`);
      currentUploadTask.cancel();
    }
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    setUploadProgress(0);
    setIsProcessing(false);
    setCurrentUploadTask(null);
    onUploadComplete(null);
    setFileNameForDisplay(null);
    resetInputAndCaptureState();
    toast({ title: 'Imagem Removida', description: 'A imagem foi removida do campo.' });
  };

  const handleCancelUpload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (currentUploadTask) {
      console.log(`[ImageUploadInput ${id}] User explicitly cancelling upload task for ${fileNameForDisplay}`);
      currentUploadTask.cancel();
    } else {
      setIsProcessing(false);
      setUploadProgress(0);
      setError("Upload cancelado pelo usuário.");
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
      resetInputAndCaptureState();
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isProcessing || (preview && !error) ) {
      return;
    }
    setIsChoiceDialogOpen(true);
  };

  return (
    <div className="space-y-2">
      <AlertDialog open={isChoiceDialogOpen} onOpenChange={setIsChoiceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escolher Imagem</AlertDialogTitle>
            <AlertDialogDescription>
              De onde você gostaria de adicionar a imagem?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end sm:space-x-2">
            <Button onClick={() => triggerFileInput(true)} className="w-full sm:w-auto">
              <Camera className="mr-2 h-4 w-4" /> Tirar Foto com a Câmera
            </Button>
            <Button onClick={() => triggerFileInput(false)} variant="outline" className="w-full sm:w-auto">
              <ImageIconLucide className="mr-2 h-4 w-4" /> Selecionar da Galeria
            </Button>
            <AlertDialogCancel className="w-full sm:w-auto mt-0 sm:mt-0">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden transition-colors ${
          error ? 'border-destructive' : 'border-border hover:border-primary'
        } ${isProcessing || (preview && !error) ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={handleContainerClick}
        role="button"
        tabIndex={isProcessing || (preview && !error) ? -1 : 0}
        onKeyDown={(e) => !isProcessing && !(preview && !error) && (e.key === 'Enter' || e.key === ' ') && setIsChoiceDialogOpen(true)}
        aria-label={`Enviar imagem ${id}`}
        aria-disabled={isProcessing}
      >
        {isProcessing && uploadProgress < 100 && !error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Enviando {fileNameForDisplay ? `"${fileNameForDisplay}"` : 'imagem'}...</p>
            <div className="w-3/4 mt-1">
              <Progress value={uploadProgress} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          </div>
        ) : isProcessing && uploadProgress === 100 && !error ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">{`Finalizando ${fileNameForDisplay ? `"${fileNameForDisplay}"` : 'imagem'}...`}</p>
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-2">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium">Erro:</p>
            <p className="text-xs break-words">{error}</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); setUploadProgress(0); setIsChoiceDialogOpen(true); }}>Tentar novamente</Button>
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
          accept="image/*" 
          onChange={handleFileChange}
          disabled={isProcessing}
          aria-hidden="true"
        />
      </div>
      {preview && !isProcessing && !error && (
        <Button variant="outline" size="sm" onClick={(e) => handleRemoveImage(e)} className="w-full text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Remover Imagem
        </Button>
      )}
      {isProcessing && uploadProgress < 100 && currentUploadTask && (
        <Button variant="outline" size="sm" onClick={(e) => handleCancelUpload(e)} className="w-full mt-2 text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Cancelar Upload
        </Button>
      )}
    </div>
  );
}

    