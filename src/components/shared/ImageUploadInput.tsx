
'use client';
import React, { useState, ChangeEvent, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadInputProps {
  onImageUpload: (dataUri: string | null) => void;
  id: string;
  currentImageUrl?: string | null; 
}

export default function ImageUploadInput({ onImageUpload, id, currentImageUrl }: ImageUploadInputProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'Arquivo muito grande',
          description: 'Por favor, envie uma imagem menor que 5MB.',
          variant: 'destructive',
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast({
          title: 'Tipo de arquivo inválido',
          description: 'Por favor, envie um arquivo de imagem válido (JPEG, PNG, WEBP, GIF).',
          variant: 'destructive',
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
        return;
      }
      
      setIsReadingFile(true);
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPreview(dataUri);
        onImageUpload(dataUri);
        setIsReadingFile(false);
      };

      reader.onerror = () => {
        setIsReadingFile(false);
        toast({
          title: 'Erro ao Ler Arquivo',
          description: 'Não foi possível processar o arquivo selecionado. Por favor, tente novamente.',
          variant: 'destructive',
        });
        onImageUpload(null); // Reset onImageUpload callback
        setPreview(null); // Reset preview
        if (fileInputRef.current) { // Reset file input so the same file can be re-selected if needed
          fileInputRef.current.value = '';
        }
      };
      
      reader.readAsDataURL(file);
    } else {
      // This case handles when a file selection is cancelled
      // or if an invalid file was previously selected and input was reset
      if (!currentImageUrl) { // Only clear if there wasn't an initial image
          setPreview(null);
          onImageUpload(null);
      }
       // Do not reset fileInputRef.current.value here as it might interfere with re-selection
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  return (
    <div className="space-y-2">
      <div
        className="w-full h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden cursor-pointer hover:border-primary transition-colors"
        onClick={() => !isReadingFile && fileInputRef.current?.click()} // Prevent click when reading
        role="button"
        tabIndex={isReadingFile ? -1 : 0} // Prevent tabbing when reading
        onKeyDown={(e) => !isReadingFile && e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label={`Enviar imagem ${id}`}
        aria-disabled={isReadingFile}
      >
        {isReadingFile ? (
          <div className="text-center text-muted-foreground">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-2 text-sm">Processando imagem...</p>
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
          disabled={isReadingFile}
        />
      </div>
      {preview && !isReadingFile && (
        <Button variant="outline" size="sm" onClick={handleRemoveImage} className="w-full text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Remover Imagem
        </Button>
      )}
    </div>
  );
}
