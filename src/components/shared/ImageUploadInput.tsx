
'use client';
import React, { useState, ChangeEvent, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Removed: import { uploadImage } from '@/services/imageUploadService';

interface ImageUploadInputProps {
  onUploadComplete: (dataUri: string | null) => void;
  id: string;
  currentImageUrl?: string | null;
  // Removed: userId?: string; 
}

export default function ImageUploadInput({ onUploadComplete, id, currentImageUrl }: ImageUploadInputProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (file) {
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
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPreview(dataUri);
        onUploadComplete(dataUri);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        console.error("[ImageUploadInput] Error reading file");
        toast({ title: 'Falha ao Ler Imagem', description: 'Não foi possível processar o arquivo da imagem.', variant: 'destructive' });
        setError('Falha ao ler arquivo.');
        onUploadComplete(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } else {
      if (!currentImageUrl) {
        setPreview(null);
        onUploadComplete(null);
      }
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setError(null);
    onUploadComplete(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
