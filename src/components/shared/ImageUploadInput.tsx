
'use client';
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Loader2, AlertCircle, Camera, Image as ImageIcon } from 'lucide-react'; // Added Camera and ImageIcon
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/services/imageUploadService';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);

  useEffect(() => {
    if (currentImageUrl !== preview) {
        setPreview(currentImageUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    // Reset capture attribute after selection, regardless of success or failure
    if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
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
       if (fileInputRef.current) fileInputRef.current.value = ''; // Clear the input value
      return;
    }

    if (file) {
      console.log(`[ImageUploadInput ${id}] File selected: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.type}`);

      if (file.size > 10 * 1024 * 1024) { // 10MB limit for original file
        console.warn(`[ImageUploadInput ${id}] File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        toast({ title: 'Arquivo muito grande', description: 'Selecione uma imagem menor que 10MB.', variant: 'destructive' });
        setError('Arquivo muito grande (máx 10MB).');
        onUploadComplete(null);
        setPreview(null);
         if (fileInputRef.current) fileInputRef.current.value = ''; // Clear the input value
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        console.warn(`[ImageUploadInput ${id}] Invalid file type: ${file.type}`);
        toast({ title: 'Tipo de arquivo inválido', description: 'Envie JPEG, PNG, ou WEBP.', variant: 'destructive' });
        setError('Tipo de arquivo inválido.');
        onUploadComplete(null);
        setPreview(null);
         if (fileInputRef.current) fileInputRef.current.value = ''; // Clear the input value
        return;
      }

      setIsProcessing(true);
      setPreview(URL.createObjectURL(file)); // Show local preview immediately
      onUploadComplete(null); // Clear any previous URL

      try {
        console.log(`[ImageUploadInput ${id}] Uploading original file...`);
        const uploadStartTime = performance.now();
        const downloadURL = await uploadImage(file, user.id);
        const uploadEndTime = performance.now();
        console.log(`[ImageUploadInput ${id}] Upload took ${(uploadEndTime - uploadStartTime) / 1000} seconds.`);
        console.log(`[ImageUploadInput ${id}] Upload successful. URL: ${downloadURL}`);
        
        setPreview(downloadURL); // Update preview with actual Storage URL
        onUploadComplete(downloadURL);
        toast({ title: 'Upload Concluído', description: 'Imagem enviada com sucesso!' });
      } catch (e: any) {
        console.error(`[ImageUploadInput ${id}] Error during image upload:`, e);
        const userMessage = e.message || 'Falha no envio. Tente novamente.';
        
        toast({ title: 'Falha no Upload', description: userMessage, variant: 'destructive' });
        setError(userMessage);
        setPreview(null); // Clear preview on error
        onUploadComplete(null);
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Clear the input value
      }
    } else {
      console.log(`[ImageUploadInput ${id}] No file selected or event.target.files is null/empty.`);
      if (!currentImageUrl && !preview) { 
        setPreview(null);
        onUploadComplete(null);
      }
    }
  };

  const triggerFileInput = (captureMode?: 'environment' | 'user') => {
    if (fileInputRef.current) {
      if (captureMode) {
        fileInputRef.current.setAttribute('capture', captureMode);
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
    setIsChoiceDialogOpen(false);
  };

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    console.log(`[ImageUploadInput ${id}] handleRemoveImage called.`);
    setPreview(null);
    setError(null);
    onUploadComplete(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.removeAttribute('capture');
    }
  };

  const handleContainerClick = () => {
    if (!isProcessing && !preview && !error) {
        setIsChoiceDialogOpen(true);
    } else if (error && !isProcessing) {
        // If there's an error, clicking the container should retry with gallery by default
        triggerFileInput();
    }
    // If preview is shown or isProcessing, the container click does nothing directly
  };

  return (
    <div className="space-y-2">
      <AlertDialog open={isChoiceDialogOpen} onOpenChange={setIsChoiceDialogOpen}>
        {/* The trigger is now the main container div */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escolher Fonte da Imagem</AlertDialogTitle>
            <AlertDialogDescription>
              Você gostaria de selecionar uma imagem da sua galeria ou tirar uma nova foto com a câmera?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => triggerFileInput()}
              className="bg-primary hover:bg-primary/90"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Galeria
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => triggerFileInput('environment')}
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
        onKeyDown={(e) => !isProcessing && !preview && (e.key === 'Enter' || e.key === ' ') && handleContainerClick()}
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
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); handleContainerClick(); }}>Tentar novamente</Button>
          </div>
        ) : preview ? (
          <Image src={preview} alt={`Pré-visualização ${id}`} fill style={{objectFit: "contain"}} className="p-1" />
        ) : (
          <div className="text-center text-muted-foreground p-2">
            <UploadCloud className="mx-auto h-10 w-10" />
            <p className="mt-2 text-sm">Clique para enviar</p>
            <p className="text-xs">PNG, JPG, WEBP (máx 10MB)</p>
          </div>
        )}
        <Input
          type="file"
          id={id}
          ref={fileInputRef}
          className="hidden"
          accept="image/*" // Keep it general, capture attribute will handle camera
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

