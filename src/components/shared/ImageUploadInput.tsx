
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
      if (!currentImageUrl) { // Se currentImageUrl for null/undefined, limpa o nome do arquivo também
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
    // currentUploadTask será setado como null no finally do handleFileChange anterior ou antes de um novo upload.
  };

  const triggerFileInput = (useCamera: boolean) => {
    console.log(`[ImageUploadInput ${id}] triggerFileInput: Attempting to open file chooser. useCamera: ${useCamera}`);
    if (fileInputRef.current) {
      console.log(`[ImageUploadInput ${id}] triggerFileInput: Resetting input value.`);
      fileInputRef.current.value = ''; 

      if (useCamera) {
        console.log(`[ImageUploadInput ${id}] triggerFileInput: Setting capture='environment'.`);
        fileInputRef.current.setAttribute('capture', 'environment');
      } else {
        console.log(`[ImageUploadInput ${id}] triggerFileInput: Ensuring capture attribute is removed.`);
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
      console.log(`[ImageUploadInput ${id}] triggerFileInput: Click triggered on input element.`);
    } else {
      console.error(`[ImageUploadInput ${id}] triggerFileInput: fileInputRef is null.`);
    }
    setIsChoiceDialogOpen(false);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log(`[ImageUploadInput ${id}] handleFileChange: File selected - Name: ${file?.name}, Type: ${file?.type}, Size: ${file?.size} bytes. Input value: '${event.target.value}'`);

    if (!file) {
      console.warn(`[ImageUploadInput ${id}] handleFileChange: No file selected or dialog cancelled by user.`);
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
        console.log(`[ImageUploadInput ${id}] handleFileChange: Capture attribute removed as no file was selected.`);
      }
      return;
    }

    resetStateBeforeNewUploadAttempt();
    setFileNameForDisplay(file.name);
    setIsProcessing(true);
    
    console.log(`[ImageUploadInput ${id}] File object details: `, {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    if (!user || !user.id) {
      console.error(`[ImageUploadInput ${id}] User not identified for upload of ${file.name}.`);
      toast({ title: 'Erro de Autenticação', description: 'Usuário não identificado para upload.', variant: 'destructive' });
      setError('Usuário não identificado.');
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null); // Limpar nome do arquivo em erro de usuário
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({ title: 'Arquivo muito grande', description: 'Selecione uma imagem menor que 10MB.', variant: 'destructive' });
      setError('Arquivo muito grande (máx 10MB).');
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null); // Limpar nome do arquivo em erro de tamanho
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type.toLowerCase())) {
      toast({ title: 'Tipo de arquivo inválido', description: 'Envie JPEG, PNG, WEBP, HEIC ou HEIF.', variant: 'destructive' });
      setError('Tipo de arquivo inválido.');
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null); // Limpar nome do arquivo em erro de tipo
      return;
    }
    
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl); 
    setUploadProgress(0); 
    
    // Limpar qualquer tarefa de upload anterior antes de iniciar uma nova.
    if (currentUploadTask) {
        console.warn(`[ImageUploadInput ${id}] handleFileChange: Cancelling potentially lingering upload task before new upload.`);
        currentUploadTask.cancel();
        setCurrentUploadTask(null);
    }


    console.log(`[ImageUploadInput ${id}] handleFileChange: Starting upload process for ${file.name}. Local preview URL created: ${localPreviewUrl}`);

    try {
      const { uploadTask, promise: uploadPromise } = uploadImage(
        file,
        user.id,
        (percentage) => {
          console.log(`[ImageUploadInput ${id}] Progress Update Callback from service: ${percentage}% for ${file.name}`);
          setUploadProgress(percentage);
        }
      );
      setCurrentUploadTask(uploadTask); // Armazenar a nova tarefa

      const downloadURL = await uploadPromise;
      console.log(`[ImageUploadInput ${id}] Upload successful for ${file.name}. URL: ${downloadURL}`);
      
      if (preview === localPreviewUrl) { // Revogar somente se o preview atual for o local (evita revogar URL final)
        console.log(`[ImageUploadInput ${id}] Revoking local preview URL (on success): ${localPreviewUrl}`);
        URL.revokeObjectURL(localPreviewUrl);
      }
      setPreview(downloadURL);
      onUploadComplete(downloadURL);
      toast({ title: 'Upload Concluído', description: `Imagem ${fileNameForDisplay || file.name} enviada!` });
      // fileNameForDisplay já foi setado

    } catch (uploadError: any) {
      console.error(`[ImageUploadInput ${id}] Error during image upload for ${file.name}. Message: ${uploadError.message}`, uploadError);
      
      if (preview === localPreviewUrl) {
         console.log(`[ImageUploadInput ${id}] Revoking local preview URL (on error/cancel): ${localPreviewUrl}`);
         URL.revokeObjectURL(localPreviewUrl);
      }
      
      let toastTitle = 'Falha no Upload';
      let toastDescription = uploadError.message || 'Ocorreu um erro ao enviar sua imagem. Tente novamente.';
      
      if (uploadError && uploadError.code === 'storage/canceled') {
        toastTitle = 'Upload Cancelado';
        toastDescription = `O envio de ${fileNameForDisplay || file.name} foi cancelado.`;
      }
      
      toast({ title: toastTitle, description: toastDescription, variant: toastTitle === 'Upload Cancelado' ? 'default' : 'destructive' });
      setError(toastDescription);
      setPreview(currentImageUrl || null); 
      onUploadComplete(currentImageUrl || null);
      // Manter o nome do arquivo se foi cancelado, limpar se foi outro erro.
      if (toastTitle !== 'Upload Cancelado') {
        setFileNameForDisplay(null);
      }

    } finally {
      console.log(`[ImageUploadInput ${id}] handleFileChange: Upload attempt finished for ${fileNameForDisplay}. Cleaning up.`);
      setIsProcessing(false);
      setCurrentUploadTask(null); // Limpar a tarefa atual
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture'); // Ensure capture is always removed
        fileInputRef.current.value = ''; // Also clear the input value post-operation
        console.log(`[ImageUploadInput ${id}] handleFileChange: Capture attribute removed and input value cleared in finally block.`);
      }
    }
  };

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    console.log(`[ImageUploadInput ${id}] handleRemoveImage called.`);
    if (currentUploadTask) {
      console.log(`[ImageUploadInput ${id}] handleRemoveImage: Cancelling active upload task for ${fileNameForDisplay}.`);
      currentUploadTask.cancel(); 
    } else {
      if (preview && preview.startsWith('blob:')) {
        console.log(`[ImageUploadInput ${id}] handleRemoveImage: Revoking local blob preview: ${preview}`);
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
      console.log(`[ImageUploadInput ${id}] handleCancelUpload: User explicitly cancelling upload task for ${fileNameForDisplay}`);
      currentUploadTask.cancel(); 
    } else {
      console.warn(`[ImageUploadInput ${id}] handleCancelUpload: No currentUploadTask to cancel. Resetting state.`);
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
    console.log(`[ImageUploadInput ${id}] handleContainerClick: Opening choice dialog.`);
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
          <AlertDialogFooter className="flex flex-col gap-2 pt-2">
            <Button onClick={() => triggerFileInput(true)} className="w-full">
              <Camera className="mr-2 h-4 w-4" /> Tirar Foto com a Câmera
            </Button>
            <Button onClick={() => triggerFileInput(false)} variant="outline" className="w-full">
              <ImageIconLucide className="mr-2 h-4 w-4" /> Selecionar da Galeria
            </Button>
            <AlertDialogCancel className="w-full mt-0">Cancelar</AlertDialogCancel>
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
