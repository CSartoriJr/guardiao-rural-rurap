
'use client';
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/services/imageUploadService'; // Re-enabled for Firebase Storage
import { useAuth } from '@/hooks/useAuth'; // To get userId

interface ImageUploadInputProps {
  onUploadComplete: (url: string | null) => void; // Will now be URL from Firebase Storage
  id: string;
  currentImageUrl?: string | null; // To display existing image on edit (if applicable)
}

export default function ImageUploadInput({ onUploadComplete, id, currentImageUrl }: ImageUploadInputProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user for userId

  useEffect(() => {
    // If currentImageUrl changes (e.g. form reset with existing data), update preview
    setPreview(currentImageUrl || null);
  }, [currentImageUrl]);


  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!user || !user.id) {
        toast({ title: 'Erro de Autenticação', description: 'Usuário não identificado para upload.', variant: 'destructive'});
        setError('Usuário não identificado.');
        return;
    }

    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: 'Arquivo muito grande', description: 'Por favor, envie uma imagem menor que 5MB.', variant: 'destructive' });
        setError('Arquivo muito grande (máx 5MB).');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { // Removed GIF for simplicity, can add back
        toast({ title: 'Tipo de arquivo inválido', description: 'Envie JPEG, PNG, ou WEBP.', variant: 'destructive' });
        setError('Tipo de arquivo inválido.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setIsProcessing(true);
      try {
        const downloadURL = await uploadImage(file, user.id); // Use uploadImage service
        setPreview(downloadURL);
        onUploadComplete(downloadURL);
        toast({ title: 'Upload Concluído', description: 'Imagem enviada com sucesso!'});
      } catch (uploadError: any) {
        console.error("[ImageUploadInput] Error uploading file to Firebase Storage:", uploadError);
        toast({ title: 'Falha no Upload', description: uploadError.message || 'Não foi possível enviar a imagem.', variant: 'destructive' });
        setError(uploadError.message || 'Falha no envio.');
        onUploadComplete(null);
        setPreview(null); // Clear preview on error
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
      } finally {
        setIsProcessing(false);
      }
    } else {
      // If no file is selected after having one, clear it (unless there's a currentImageUrl)
      if (!currentImageUrl) {
        setPreview(null);
        onUploadComplete(null);
      }
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setError(null);
    onUploadComplete(null); // Signal removal
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the file input
    }
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
            <p className="mt-2 text-sm">Enviando...</p>
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-2">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium">Erro:</p>
            <p className="text-xs break-words">{error}</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={(e) => { e.stopPropagation(); setError(null); fileInputRef.current?.click(); }}>Tentar novamente</Button>
          </div>
        ) : preview ? (
          <Image src={preview} alt={`Pré-visualização ${id}`} layout="fill" objectFit="contain" className="p-1" />
        ) : (
          <div className="text-center text-muted-foreground">
            <UploadCloud className="mx-auto h-12 w-12" />
            <p className="mt-2 text-sm">Clique ou arraste para enviar</p>
            <p className="text-xs">PNG, JPG, WEBP até 5MB</p>
          </div>
        )}
        <Input
          type="file"
          id={id}
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
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
