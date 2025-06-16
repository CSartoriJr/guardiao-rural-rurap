
'use client';
import React, { useState, ChangeEvent, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/services/imageUploadService'; // Import the upload service

interface ImageUploadInputProps {
  onUploadComplete: (dataUri: string | null) => void; // Changed from onImageUpload
  id: string;
  currentImageUrl?: string | null;
  userId?: string; // Added userId prop
}

export default function ImageUploadInput({ onUploadComplete, id, currentImageUrl, userId }: ImageUploadInputProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Covers both reading and uploading
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null); // Clear previous errors

    if (file) {
      if (!userId) {
        toast({ title: 'Erro', description: 'ID do usuário não fornecido para o upload.', variant: 'destructive' });
        setError('ID do usuário ausente.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: 'Arquivo muito grande', description: 'Por favor, envie uma imagem menor que 5MB.', variant: 'destructive' });
        setError('Arquivo muito grande.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast({ title: 'Tipo de arquivo inválido', description: 'Envie JPEG, PNG, WEBP, ou GIF.', variant: 'destructive' });
        setError('Tipo de arquivo inválido.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setIsProcessing(true);

      // Generate local preview
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      try {
        const downloadURL = await uploadImage(file, userId);
        onUploadComplete(downloadURL);
        // Preview is already set from local FileReader
      } catch (uploadError: any) {
        console.error("ImageUploadInput: Error during upload", uploadError);
        toast({ title: 'Falha no Envio', description: uploadError.message || 'Não foi possível enviar a imagem.', variant: 'destructive' });
        setError(uploadError.message || 'Falha no envio.');
        onUploadComplete(null);
        setPreview(null); // Clear preview on upload error
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setIsProcessing(false);
      }
    } else {
      // File selection cancelled
      if (!currentImageUrl) {
        setPreview(null);
        onUploadComplete(null);
      }
      // Do not reset fileInputRef.current.value here
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setError(null);
    onUploadComplete(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Note: This does not delete the image from Firebase Storage if it was already uploaded.
    // Implementing delete from storage would require additional logic.
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
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Tentar novamente</Button>
          </div>
        ) : preview ? (
          <Image src={preview} alt={`Pré-visualização ${id}`} layout="fill" objectFit="contain" className="p-1" />
        ) : (
          <div className="text-center text-muted-foreground">
            <UploadCloud className="mx-auto h-12 w-12" />
            <p className="mt-2 text-sm">Clique ou arraste para enviar</p>
            <p className="text-xs">PNG, JPG, GIF até 5MB</p>
          </div>
        )}
        <Input
          type="file"
          id={id}
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/gif, image/webp"
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
