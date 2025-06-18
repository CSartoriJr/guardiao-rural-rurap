
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
    // Sincronizar o preview com a imagem atual se ela mudar externamente e não estivermos processando
    if (currentImageUrl !== preview && !isProcessing) {
      setPreview(currentImageUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]);


  const resetStateBeforeNewUploadAttempt = () => {
    console.log(`[ImageUploadInput ${id}] resetStateBeforeNewUploadAttempt called.`);
    setError(null);
    setUploadProgress(0); // Iniciar em 0 para visualização imediata da barra
    setCurrentUploadTask(null);
    // Não limpar o preview aqui diretamente, pois ele pode ser uma URL de objeto que precisa ser revogada,
    // ou pode ser revertido para currentImageUrl.
    // onUploadComplete(null); // Notificar pai que a URL antiga não é mais válida se uma nova tentativa começar
    setFileNameForDisplay(null);
  };

  const triggerFileInput = (useCamera: boolean) => {
    console.log(`[ImageUploadInput ${id}] triggerFileInput: Attempting to open file chooser. useCamera: ${useCamera}`);
    if (fileInputRef.current) {
      console.log(`[ImageUploadInput ${id}] triggerFileInput: Resetting input value.`);
      fileInputRef.current.value = ''; // Crucial para o onChange disparar sempre

      if (useCamera) {
        console.log(`[ImageUploadInput ${id}] triggerFileInput: Setting capture='environment'.`);
        fileInputRef.current.setAttribute('capture', 'environment');
      } else {
        console.log(`[ImageUploadInput ${id}] triggerFileInput: Removing capture attribute.`);
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

    // Se o usuário cancelar a seleção de arquivo, o 'file' será undefined.
    if (!file) {
      console.warn(`[ImageUploadInput ${id}] handleFileChange: No file selected or dialog cancelled by user.`);
      // O input value já foi resetado por triggerFileInput.
      // Não precisamos fazer mais nada aqui para não interferir com o estado atual do preview/erro.
      // Importante: garantir que o atributo capture seja removido se foi setado
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
        console.log(`[ImageUploadInput ${id}] handleFileChange: Capture attribute removed as no file was selected.`);
      }
      return;
    }

    resetStateBeforeNewUploadAttempt();
    setFileNameForDisplay(file.name);
    setIsProcessing(true);
    // Preview local será setado após validações

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
    setPreview(localPreviewUrl); // Mostrar preview local imediatamente
    setUploadProgress(0); // Garantir que barra de progresso comece em 0

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
      setCurrentUploadTask(uploadTask);

      const downloadURL = await uploadPromise;
      console.log(`[ImageUploadInput ${id}] Upload successful for ${file.name}. URL: ${downloadURL}`);
      
      if (preview === localPreviewUrl) {
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
         console.log(`[ImageUploadInput ${id}] Revoking local preview URL (on error): ${localPreviewUrl}`);
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
      if (toastTitle !== 'Upload Cancelado') {
        setFileNameForDisplay(null);
      }

    } finally {
      setIsProcessing(false);
      setCurrentUploadTask(null);
      // Sempre remover o atributo capture após a tentativa de upload (sucesso, erro ou cancelamento da tarefa)
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
        console.log(`[ImageUploadInput ${id}] handleFileChange: Capture attribute removed in finally block.`);
      }
    }
  };

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Impede que o clique propague para o container e abra o diálogo
    console.log(`[ImageUploadInput ${id}] handleRemoveImage called.`);
    if (currentUploadTask) {
      console.log(`[ImageUploadInput ${id}] handleRemoveImage: Cancelling active upload task for ${fileNameForDisplay}.`);
      currentUploadTask.cancel(); // Isso vai acionar o 'storage/canceled' no catch do uploadImage
      // O restante da limpeza (preview, onUploadComplete) será tratado pelo catch
    } else {
      // Se não há task ativa, apenas limpamos o estado visual e notificamos o pai
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
        fileInputRef.current.value = ''; // Limpar o valor do input também
        fileInputRef.current.removeAttribute('capture');
      }
      toast({ title: 'Imagem Removida', description: 'A imagem foi removida do campo.' });
    }
  };

  const handleCancelUpload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Impede que o clique propague
    if (currentUploadTask) {
      console.log(`[ImageUploadInput ${id}] handleCancelUpload: User explicitly cancelling upload task for ${fileNameForDisplay}`);
      currentUploadTask.cancel(); // Isso vai acionar o erro 'storage/canceled' no try/catch do handleFileChange
    } else {
      // Caso menos comum: o usuário clicou em cancelar antes da task ser setada, ou após já ter sido limpa.
      console.warn(`[ImageUploadInput ${id}] handleCancelUpload: No currentUploadTask to cancel, but isProcessing might be true. Resetting relevant state.`);
      setIsProcessing(false);
      setUploadProgress(0);
      setError("Upload cancelado pelo usuário."); // Informar o usuário
      if (preview && preview.startsWith('blob:')) { // Limpar preview local se houver
        URL.revokeObjectURL(preview);
      }
      setPreview(currentImageUrl || null); // Reverter para a imagem original ou nenhuma
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
    // Não abrir diálogo se já há uma imagem sendo processada ou se já há uma imagem válida (sem erro)
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
        tabIndex={isProcessing || (preview && !error) ? -1 : 0} // Apenas focável se puder ser clicado
        onKeyDown={(e) => !isProcessing && !(preview && !error) && (e.key === 'Enter' || e.key === ' ') && setIsChoiceDialogOpen(true)}
        aria-label={`Enviar imagem ${id}`}
        aria-disabled={isProcessing || (!!preview && !error)} // Desabilitado se processando ou se já tem imagem válida
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
        ) : isProcessing && uploadProgress === 100 && !error ? ( // Estado de finalização
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
          id={id} // id único para o input
          ref={fileInputRef}
          className="hidden"
          accept="image/*" // Aceitar todos os tipos de imagem
          onChange={handleFileChange}
          disabled={isProcessing} // Desabilitar o input se estiver processando
          aria-hidden="true"
        />
      </div>
      {preview && !isProcessing && !error && ( // Botão Remover aparece se há preview, não está processando e não há erro
        <Button variant="outline" size="sm" onClick={(e) => handleRemoveImage(e)} className="w-full text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Remover Imagem
        </Button>
      )}
      {isProcessing && uploadProgress < 100 && currentUploadTask && ( // Botão Cancelar aparece durante o upload
        <Button variant="outline" size="sm" onClick={(e) => handleCancelUpload(e)} className="w-full mt-2 text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Cancelar Upload
        </Button>
      )}
    </div>
  );
}

  