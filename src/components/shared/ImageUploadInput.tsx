'use client';
import React, { useState, ChangeEvent, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud } from 'lucide-react'; // Removed ImageIcon as it's no longer used for the button
import { useToast } from '@/hooks/use-toast';

interface ImageUploadInputProps {
  onImageUpload: (dataUri: string | null) => void;
  id: string;
  currentImageUrl?: string | null; // For displaying an initial or existing image
}

export default function ImageUploadInput({ onImageUpload, id, currentImageUrl }: ImageUploadInputProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
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
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast({
          title: 'Tipo de arquivo inválido',
          description: 'Por favor, envie um arquivo de imagem válido (JPEG, PNG, WEBP, GIF).',
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPreview(dataUri);
        onImageUpload(dataUri);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      onImageUpload(null);
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
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label={`Enviar imagem ${id}`}
      >
        {preview ? (
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
        />
      </div>
      {preview && (
        <Button variant="outline" size="sm" onClick={handleRemoveImage} className="w-full text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Remover Imagem
        </Button>
      )}
    </div>
  );
}
