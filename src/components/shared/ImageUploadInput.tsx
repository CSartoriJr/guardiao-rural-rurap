'use client';
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, FileImage, X, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getSignedUploadUrl } from '@/ai/flows/get-signed-upload-url';
import { v4 as uuidv4 } from 'uuid';

interface ImageUploadInputProps {
  onUploadComplete: (url: string | null) => void;
  id: string;
  currentImageUrl?: string | null;
  uploadPath: string;
}

export default function ImageUploadInput({ onUploadComplete, id, currentImageUrl, uploadPath }: ImageUploadInputProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { toast } = useToast();
  
  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  useEffect(() => {
    const currentPreviewUrl = previewUrl;
    // Cleanup function to revoke the object URL to avoid memory leaks
    return () => {
      if (currentPreviewUrl && currentPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // Reset input to allow re-selecting the same file

    if (!file) return;
    
    setError(null);
    setUploadProgress(0);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      const errorMsg = 'Tipo inválido. Use JPEG, PNG, WEBP, ou HEIC.';
      toast({ title: 'Arquivo Inválido', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setPreviewUrl(null);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      return;
    }
    
    if (!uploadPath) {
      const errorMsg = 'O caminho de destino para o upload não foi especificado. Selecione um agricultor primeiro.';
      toast({ title: 'Erro de Configuração', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setPreviewUrl(null);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      return;
    }

    setIsUploading(true);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpeg';
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const fullPath = `${uploadPath}/${uniqueFileName}`;

      toast({ title: 'Preparando upload seguro...' });
      
      const { signedUrl } = await getSignedUploadUrl({
        filePath: fullPath,
        contentType: file.type,
      });

      abortControllerRef.current = new AbortController();
      const response = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Falha no upload: ${response.status} ${response.statusText}`);
      }

      const publicUrl = signedUrl.split('?')[0]; // The URL without query params is the public one
      onUploadComplete(publicUrl);
      setPreviewUrl(publicUrl);
      toast({ title: 'Upload Concluído', description: 'Sua imagem foi enviada.' });

    } catch (uploadError: any) {
      if (uploadError.name === 'AbortError') {
        setError('Upload cancelado.');
      } else {
        let userFriendlyMessage = uploadError.message || 'Ocorreu um erro ao enviar a imagem.';
        setError(userFriendlyMessage);
        toast({ title: 'Falha no Upload', description: userFriendlyMessage, variant: 'destructive' });
      }
      onUploadComplete(null);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };
  
  const handleRemoveOrCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    } else {
      setError(null);
      setUploadProgress(0);
      onUploadComplete(null);
      setPreviewUrl(null);
      toast({ title: 'Imagem Removida' });
    }
  };
  
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <Input
        ref={fileInputRef}
        type="file"
        id={id}
        name={id}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading || !uploadPath}
        aria-hidden="true"
      />
      <Input
        ref={cameraInputRef}
        type="file"
        id={`${id}-camera`}
        name={`${id}-camera`}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={isUploading || !uploadPath}
        aria-hidden="true"
      />

      <div
        className={`relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/50 transition-colors ${
          error ? 'border-destructive' : 'border-border'
        }`}
      >
        {isUploading ? (
          <>
            {previewUrl && <Image src={previewUrl} alt={`Pré-visualização de envio ${id}`} fill sizes="100vw" style={{objectFit: "contain"}} className="p-1 opacity-40" unoptimized />}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Enviando...</p>
              {/* Progress bar can be complex with fetch, so we show an indeterminate state */}
            </div>
          </>
        ) : error ? (
          <div className="p-2 text-center text-destructive">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium break-words">{error}</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { setError(null); fileInputRef.current?.click(); }}>
              Tentar Novamente
            </Button>
          </div>
        ) : previewUrl ? (
           <Image src={previewUrl} alt={`Pré-visualização ${id}`} fill sizes="100vw" style={{objectFit: "contain"}} className="p-1" data-ai-hint="plant leaf symptom cassava" unoptimized />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => cameraInputRef.current?.click()} disabled={isUploading || !uploadPath}>
              <Camera className="mr-2 h-4 w-4" />
              Tirar Foto
            </Button>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isUploading || !uploadPath}>
              <FileImage className="mr-2 h-4 w-4" />
              Escolher da Galeria
            </Button>
             <p className="text-xs text-muted-foreground mt-2 text-center">
              Para melhores resultados, tire a foto com o celular na horizontal.
            </p>
          </div>
        )}
      </div>

      {(previewUrl && !isUploading) && (
        <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="text-destructive hover:border-destructive/80 hover:bg-destructive/10 mt-2">
          <X className="mr-2 h-4 w-4" /> Remover Imagem
        </Button>
      )}
      {isUploading && (
        <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="mt-2 text-destructive hover:border-destructive/80 hover:bg-destructive/10">
          <X className="mr-2 h-4 w-4" /> Cancelar Upload
        </Button>
      )}
    </div>
  );
}
