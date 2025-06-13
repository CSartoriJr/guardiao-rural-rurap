'use client';
import React, { useState, ChangeEvent, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Image as ImageIcon } from 'lucide-react';
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
          title: 'File too large',
          description: 'Please upload an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a valid image file (JPEG, PNG, WEBP, GIF).',
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
        aria-label={`Upload image ${id}`}
      >
        {preview ? (
          <Image src={preview} alt={`Preview ${id}`} layout="fill" objectFit="contain" className="p-1" />
        ) : (
          <div className="text-center text-muted-foreground">
            <UploadCloud className="mx-auto h-12 w-12" />
            <p className="mt-2 text-sm">Click or drag to upload</p>
            <p className="text-xs">PNG, JPG, GIF up to 5MB</p>
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
          <X className="mr-2 h-4 w-4" /> Remove Image
        </Button>
      )}
       {!preview && (
         <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full">
            <ImageIcon className="mr-2 h-4 w-4" /> Select Image
        </Button>
       )}
    </div>
  );
}
