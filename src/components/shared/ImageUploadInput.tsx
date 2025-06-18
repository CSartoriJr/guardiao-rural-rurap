
'use client';
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Loader2, AlertCircle, Camera, Image as ImageIconLucide, Ban } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/services/imageUploadService';
import { useAuth } from '@/hooks/useAuth';
import type { UploadTask } from 'firebase/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImageUploadInputProps {
  onUploadComplete: (url: string | null) => void;
  id: string;
  currentImageUrl?: string | null;
}

export default function ImageUploadInput({ onUploadComplete, id, currentImageUrl }: ImageUploadInputProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [currentUploadTask, setCurrentUploadTask] = useState<UploadTask | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [fileNameForDisplay, setFileNameForDisplay] = useState<string | null>(null);

  useEffect(() => {
    // Sincronizar o preview com currentImageUrl se ele mudar externamente
    // e não for igual ao preview atual (para evitar reset durante um upload ativo).
    if (currentImageUrl !== preview && !isProcessing) {
      console.log(`[ImageUploadInput ${id}] useEffect detected currentImageUrl ('${currentImageUrl}') different from preview ('${preview}'). Updating preview.`);
      setPreview(currentImageUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]); // Depender apenas de currentImageUrl para evitar loops com preview

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log(`[ImageUploadInput ${id}] handleFileChange triggered. File selected: ${file?.name}`);

    // 1. Limpar o input de arquivo imediatamente após obter o arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.removeAttribute('capture');
    }

    // 2. Se nenhum arquivo foi selecionado (usuário cancelou o diálogo do sistema), não fazer nada.
    if (!file) {
      console.log(`[ImageUploadInput ${id}] No file selected from system dialog or dialog cancelled.`);
      // Não resetar estados aqui, pois o usuário pode ter cancelado a seleção,
      // e o estado anterior (se houver) deve ser mantido.
      return;
    }

    // 3. Um novo arquivo foi selecionado. Resetar todos os estados relevantes ANTES de processar.
    console.log(`[ImageUploadInput ${id}] New file selected: ${file.name}. Resetting states for new upload.`);
    setError(null);
    setUploadProgress(0); // Iniciar em 0 para mostrar a barra de progresso imediatamente
    setCurrentUploadTask(null);
    setPreview(null); // Limpar preview anterior
    onUploadComplete(null); // Informar pai que não há URL válida
    setFileNameForDisplay(file.name);
    setIsProcessing(true); // Marcar como processando AGORA

    if (!user || !user.id) {
      console.error(`[ImageUploadInput ${id}] User not identified for upload of ${file.name}.`);
      toast({ title: 'Erro de Autenticação', description: 'Usuário não identificado para upload.', variant: 'destructive' });
      setError('Usuário não identificado.');
      setIsProcessing(false); // Parar processamento
      setFileNameForDisplay(null);
      // Manter currentImageUrl se existir, caso contrário limpar preview
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      return;
    }

    console.log(`[ImageUploadInput ${id}] Validating file: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.type}`);
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.warn(`[ImageUploadInput ${id}] File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB for ${file.name}`);
      toast({ title: 'Arquivo muito grande', description: 'Selecione uma imagem menor que 10MB.', variant: 'destructive' });
      setError('Arquivo muito grande (máx 10MB).');
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type.toLowerCase())) {
      console.warn(`[ImageUploadInput ${id}] Invalid file type: ${file.type} for ${file.name}`);
      toast({ title: 'Tipo de arquivo inválido', description: 'Envie JPEG, PNG, WEBP, HEIC ou HEIF.', variant: 'destructive' });
      setError('Tipo de arquivo inválido.');
      setIsProcessing(false);
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
      return;
    }

    // Mostrar preview local imediatamente antes de iniciar o upload
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);
    console.log(`[ImageUploadInput ${id}] Local preview set for ${file.name}: ${localPreviewUrl}`);

    try {
      console.log(`[ImageUploadInput ${id}] Starting upload process for file: ${file.name}`);
      const { uploadTask, promise: uploadPromise } = uploadImage(
        file,
        user.id,
        (percentage) => {
          // Este é o callback de progresso do ImageUploadInput
          console.log(`[ImageUploadInput ${id}] Progress Update Callback from service: ${percentage}% for ${file.name}`);
          setUploadProgress(percentage);
        }
      );
      setCurrentUploadTask(uploadTask);
      console.log(`[ImageUploadInput ${id}] UploadTask created for ${file.name}. Waiting for promise...`);

      const downloadURL = await uploadPromise;
      console.log(`[ImageUploadInput ${id}] Upload promise resolved for ${file.name}. URL: ${downloadURL}`);

      // Limpar a URL do objeto local após o upload bem-sucedido, se ela ainda for o preview
      if (preview === localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        console.log(`[ImageUploadInput ${id}] Revoked local object URL: ${localPreviewUrl}`);
      }

      setPreview(downloadURL); // Atualizar preview para URL final do Firebase
      onUploadComplete(downloadURL);
      toast({ title: 'Upload Concluído', description: `Imagem ${fileNameForDisplay} enviada!` });
      // fileNameForDisplay é mantido até o próximo upload ou remoção
    } catch (uploadError: any) {
      console.error(`[ImageUploadInput ${id}] Error during upload process for ${fileNameForDisplay}:`, uploadError);
      // Limpar a URL do objeto local em caso de erro também
      if (preview === localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        console.log(`[ImageUploadInput ${id}] Revoked local object URL on error: ${localPreviewUrl}`);
      }

      let title = 'Falha no Upload';
      let description = uploadError.message || 'Ocorreu um erro ao enviar sua imagem. Tente novamente.';

      if (uploadError && uploadError.code === 'storage/canceled') {
        title = 'Upload Cancelado';
        description = `O envio de ${fileNameForDisplay} foi cancelado.`;
      }
      
      toast({ title, description, variant: title === 'Upload Cancelado' ? 'default' : 'destructive' });
      setError(description);
      setPreview(currentImageUrl || null); // Reverter para imagem original, se houver
      onUploadComplete(currentImageUrl || null);
      // fileNameForDisplay é mantido se houver erro para que o usuário saiba qual arquivo falhou.
      // Será limpo na próxima tentativa bem-sucedida ou remoção.
    } finally {
      console.log(`[ImageUploadInput ${id}] Upload process finished for ${fileNameForDisplay}. Setting isProcessing to false.`);
      setIsProcessing(false);
      // Não resetar uploadProgress aqui, pois pode ser útil para mostrar 100% brevemente ou um erro na barra.
      // Ele será resetado para 0 no início do próximo handleFileChange.
      setCurrentUploadTask(null);
    }
  };

  const triggerFileInput = (captureMode?: 'environment' | 'user') => {
    if (fileInputRef.current) {
      if (captureMode) {
        console.log(`[ImageUploadInput ${id}] Setting capture mode: ${captureMode}`);
        fileInputRef.current.setAttribute('capture', captureMode);
      } else {
        console.log(`[ImageUploadInput ${id}] Removing capture mode.`);
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
    setIsChoiceDialogOpen(false);
  };

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    console.log(`[ImageUploadInput ${id}] handleRemoveImage called. Current task: ${currentUploadTask ? 'exists' : 'null'}`);
    if (currentUploadTask) {
      console.log(`[ImageUploadInput ${id}] Cancelling ongoing upload task before removing.`);
      currentUploadTask.cancel(); // O callback de erro do uploadTask deve tratar o estado
    }
    // Limpar preview local se existir
    if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
        console.log(`[ImageUploadInput ${id}] Revoked local object URL on remove: ${preview}`);
    }
    setPreview(null);
    setError(null);
    setUploadProgress(null);
    setIsProcessing(false); // Garantir que não está processando
    setCurrentUploadTask(null);
    onUploadComplete(null);
    setFileNameForDisplay(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({ title: 'Imagem Removida', description: 'A imagem foi removida do campo.' });
  };

  const handleCancelUpload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (currentUploadTask) {
      console.log(`[ImageUploadInput ${id}] User initiated cancel upload for task.`);
      currentUploadTask.cancel();
    } else {
      console.log(`[ImageUploadInput ${id}] Cancel clicked but no current upload task.`);
      // Se não há tarefa, mas ainda está em isProcessing (improvável, mas para segurança)
      setIsProcessing(false);
      setUploadProgress(null);
      setError("Upload cancelado pelo usuário.");
      if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
      }
      setPreview(currentImageUrl || null);
      onUploadComplete(currentImageUrl || null);
      setFileNameForDisplay(null);
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isProcessing && !preview && !error) {
        setIsChoiceDialogOpen(true);
    } else if (error && !isProcessing) {
        setIsChoiceDialogOpen(true);
    }
  };

  return (
    <div className="space-y-2">
      <AlertDialog open={isChoiceDialogOpen} onOpenChange={setIsChoiceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escolher Fonte da Imagem</AlertDialogTitle>
            <AlertDialogDescription>
              Você gostaria de selecionar uma imagem da sua galeria ou tirar uma nova foto com a câmera?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={(e) => { e.stopPropagation(); fileInputRef.current?.removeAttribute('capture'); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
              className="bg-primary hover:bg-primary/90"
            >
              <ImageIconLucide className="mr-2 h-4 w-4" />
              Galeria
            </AlertDialogAction>
            <AlertDialogAction
              onClick={(e) => { e.stopPropagation(); triggerFileInput('environment'); }}
              className="bg-accent hover:bg-accent/90"
            >
              <Camera className="mr-2 h-4 w-4" />
              Câmera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden transition-colors ${
          error ? 'border-destructive' : 'border-border hover:border-primary'
        } ${isProcessing || preview ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={handleContainerClick}
        role="button"
        tabIndex={isProcessing || preview ? -1 : 0}
        onKeyDown={(e) => !isProcessing && !preview && (e.key === 'Enter' || e.key === ' ') && setIsChoiceDialogOpen(true)}
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
        ) : isProcessing && (uploadProgress === null || uploadProgress === 100) && !error ? ( // Estado "Processando..." ou "Finalizando..." (quando progresso é 100 mas ainda não finalizou)
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">{uploadProgress === 100 ? 'Finalizando...' : `Preparando ${fileNameForDisplay ? `"${fileNameForDisplay}"` : 'imagem'}...`}</p>
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-2">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium">Erro:</p>
            <p className="text-xs break-words">{error}</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); setUploadProgress(null); setIsChoiceDialogOpen(true); }}>Tentar novamente</Button>
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
        <Button variant="outline" size="sm" onClick={handleRemoveImage} className="w-full text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Remover Imagem
        </Button>
      )}
      {isProcessing && typeof uploadProgress === 'number' && uploadProgress < 100 && currentUploadTask && (
        <Button variant="outline" size="sm" onClick={handleCancelUpload} className="w-full mt-2 text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <Ban className="mr-2 h-4 w-4" /> Cancelar Upload
        </Button>
      )}
    </div>
  );
}

