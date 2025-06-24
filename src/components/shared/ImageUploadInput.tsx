'use client';
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
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
      if (!currentImageUrl) {
        setFileNameForDisplay(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]);

  const resetStateBeforeNewUploadAttempt = () => {
    console.log(`[ImageUploadInput ${id}] resetStateBeforeNewUploadAttempt called.`);
    setError(null);
    setUploadProgress(0); 
    setFileNameForDisplay(null);
  };

  const triggerFileInput = (useCamera: boolean) => {
    if (fileInputRef.current) {
      // We no longer reset the value here. It's now reset inside the onChange handler
      // which is a more robust pattern for mobile browsers.
      if (useCamera) {
        fileInputRef.current.setAttribute('capture', 'environment');
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
    setIsChoiceDialogOpen(false);
  };

  const processAndUploadFile = async (file: File) => {
    console.log(`[ImageUploadInput ${id}] processAndUploadFile: Starting process for file:`, file);
    resetStateBeforeNewUploadAttempt();
    setFileNameForDisplay(file.name);

    // --- Immediate Validation Checks ---
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
        const errorMsg = 'Tipo de arquivo inválido. Use JPEG, PNG, WEBP ou HEIC/HEIF.';
        console.error(`[ImageUploadInput ${id}] Validation failed: ${errorMsg}`);
        toast({ title: 'Tipo de Arquivo Inválido', description: 'Por favor, selecione um arquivo de imagem válido.', variant: 'destructive' });
        setError(errorMsg);
        setFileNameForDisplay(null);
        return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        const errorMsg = 'Arquivo muito grande (máximo 10MB).';
        console.error(`[ImageUploadInput ${id}] Validation failed: ${errorMsg}`);
        toast({ title: 'Arquivo Muito Grande', description: 'Por favor, selecione uma imagem com menos de 10MB.', variant: 'destructive' });
        setError(errorMsg);
        setFileNameForDisplay(null);
        return;
    }

    setIsProcessing(true);
    
    if (!user || !user.id) {
      const errorMsg = 'Usuário não identificado para upload.';
      console.error(`[ImageUploadInput ${id}] ${errorMsg}`);
      toast({ title: 'Erro de Autenticação', description: 'Você precisa estar logado para fazer o upload.', variant: 'destructive' });
      setError(errorMsg);
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
      return;
    }
    
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl); 
    setUploadProgress(0); 
    
    if (currentUploadTask) {
        currentUploadTask.cancel();
        setCurrentUploadTask(null);
    }

    try {
      const { uploadTask, promise: uploadPromise } = uploadImage(
        file,
        user.id,
        (percentage) => {
          setUploadProgress(percentage);
        }
      );
      setCurrentUploadTask(uploadTask);

      const downloadURL = await uploadPromise;
      onUploadComplete(downloadURL);
      toast({ title: 'Upload Concluído', description: `Imagem ${fileNameForDisplay || file.name} enviada!` });

    } catch (uploadError: any) {
      console.error(`[ImageUploadInput ${id}] Error during image upload for ${file.name}. Message: ${uploadError.message}`, uploadError);
            
      let toastTitle = 'Falha no Upload';
      let toastDescription = uploadError.message || 'Ocorreu um erro ao enviar sua imagem. Tente novamente.';
      
      if (uploadError && uploadError.code === 'storage/canceled') {
        toastTitle = 'Upload Cancelado';
        toastDescription = `O envio de ${fileNameForDisplay || file.name} foi cancelado.`;
      }
      
      toast({ title: toastTitle, description: toastDescription, variant: toastTitle === 'Upload Cancelado' ? 'default' : 'destructive' });
      setError(toastDescription);
      onUploadComplete(currentImageUrl || null);
      if (toastTitle !== 'Upload Cancelado') {
        setFileNameForDisplay(null);
      }

    } finally {
      // The local object URL should be revoked, but only if it's still the one being previewed.
      // This is to avoid revoking a new image URL if another upload starts quickly.
      if (preview === localPreviewUrl) {
         URL.revokeObjectURL(localPreviewUrl);
         // After processing, reset the preview to the officially stored URL
         setPreview(currentImageUrl || null);
      }
      
      setIsProcessing(false);
      setCurrentUploadTask(null);
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // Immediately reset the input value to allow re-selection of the same file.
    // This is a crucial fix for mobile browser compatibility.
    if (event.target) {
      event.target.value = '';
    }

    if (!file) {
      console.warn(`[ImageUploadInput ${id}] handleFileChange: No file selected or dialog was cancelled.`);
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
      }
      return;
    }

    processAndUploadFile(file);
  };

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    if (currentUploadTask) {
      currentUploadTask.cancel(); 
    } else {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setPreview(null);
      setError(null);
      setUploadProgress(0);
      setIsProcessing(false);
      onUploadComplete(null);
      setFileNameForDisplay(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
        fileInputRef.current.removeAttribute('capture');
      }
      toast({ title: 'Imagem Removida', description: 'A imagem foi removida do campo.' });
    }
  };

  const handleCancelUpload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    if (currentUploadTask) {
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.removeAttribute('capture');
      }
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
          <AlertDialogFooter className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button onClick={() => triggerFileInput(true)} className="w-full">
              <Camera className="mr-2 h-4 w-4" /> Câmera
            </Button>
            <Button onClick={() => triggerFileInput(false)} variant="outline" className="w-full">
              <ImageIconLucide className="mr-2 h-4 w-4" /> Galeria
            </Button>
            <AlertDialogCancel className="w-full mt-2 sm:mt-0">Cancelar</AlertDialogCancel>
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
        aria-disabled={isProcessing || (!!preview && !error)}
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
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
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
