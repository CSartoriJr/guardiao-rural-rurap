'use client';
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, FileImage, X, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { uploadImageWithSignedUrl } from '@/services/imageUploadService';

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
  const uploadControllerRef = useRef<AbortController | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Sincroniza o previewUrl se a prop externa mudar
    if (currentImageUrl && currentImageUrl !== previewUrl) {
      setPreviewUrl(currentImageUrl);
    }
    // Se a currentImageUrl for removida (ex: reset do form), limpa o preview
    if (!currentImageUrl && previewUrl) {
        if (previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
    }
  }, [currentImageUrl]);


  useEffect(() => {
    // Cleanup function para revogar a URL do objeto e evitar vazamentos de memória
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      // Cancela o upload se o componente for desmontado
      if (uploadControllerRef.current) {
        uploadControllerRef.current.abort();
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // Limpa o input para permitir selecionar o mesmo arquivo novamente

    if (!file) return;
    
    setError(null);
    setUploadProgress(0);

    // Cria uma URL local para pré-visualização instantânea
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      const errorMsg = 'Tipo inválido. Use JPEG, PNG, WEBP, ou HEIC.';
      toast({ title: 'Arquivo Inválido', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
      return;
    }
    
    if (!uploadPath) {
        const errorMsg = 'O caminho de destino para o upload não foi especificado. Selecione um agricultor primeiro.';
        toast({ title: 'Erro de Configuração', description: errorMsg, variant: 'destructive' });
        setError(errorMsg);
        setPreviewUrl(null);
        URL.revokeObjectURL(objectUrl);
        return;
    }

    setIsUploading(true);
    uploadControllerRef.current = new AbortController();

    try {
      const downloadURL = await uploadImageWithSignedUrl(
        file,
        uploadPath,
        (percentage) => setUploadProgress(percentage),
        uploadControllerRef.current.signal
      );
      
      onUploadComplete(downloadURL);
      // Não precisa mais setar a previewUrl aqui, pois a URL permanente não é necessária para a visualização
      toast({ title: 'Upload Concluído', description: 'Sua imagem foi enviada com sucesso.' });

    } catch (uploadError: any) {
      if (uploadError.name === 'AbortError') {
        setError('Upload cancelado.');
        setPreviewUrl(null);
        URL.revokeObjectURL(objectUrl);
      } else {
        const errorMsg = uploadError.message || 'Ocorreu um erro ao enviar a imagem.';
        setError(errorMsg);
        setPreviewUrl(null);
        URL.revokeObjectURL(objectUrl);
        toast({ title: 'Falha no Upload', description: errorMsg, variant: 'destructive' });
      }
      onUploadComplete(null);
    } finally {
      setIsUploading(false);
      uploadControllerRef.current = null;
    }
  };
  
  const handleRemoveOrCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (uploadControllerRef.current) {
      uploadControllerRef.current.abort();
    } else {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setError(null);
        setUploadProgress(0);
        setPreviewUrl(null);
        onUploadComplete(null);
        if (currentImageUrl) {
            toast({ title: 'Imagem Removida' });
        }
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
        {previewUrl && (
          <Image src={previewUrl} alt={`Pré-visualização ${id}`} fill sizes="100vw" style={{objectFit: "contain"}} className={`p-1 ${isUploading ? 'opacity-40' : ''}`} data-ai-hint="plant leaf symptom cassava" unoptimized={previewUrl.startsWith('blob:')} />
        )}

        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Enviando...</p>
            <div className="w-full px-4 mt-1 relative">
                <Progress value={uploadProgress} className="h-4" />
                <p className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-primary-foreground">{uploadProgress.toFixed(0)}%</p>
            </div>
          </div>
        )}

        {error && !isUploading && (
          <div className="p-2 text-center text-destructive">
            <AlertCircle className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-medium break-words">{error}</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { setError(null); fileInputRef.current?.click(); }}>
              Tentar Novamente
            </Button>
          </div>
        )}
        
        {!previewUrl && !isUploading && !error && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => cameraInputRef.current?.click()} disabled={!uploadPath}>
              <Camera className="mr-2 h-4 w-4" />
              Tirar Foto
            </Button>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={!uploadPath}>
              <FileImage className="mr-2 h-4 w-4" />
              Escolher da Galeria
            </Button>
             <p className="text-xs text-muted-foreground mt-2 text-center">
              Para melhores resultados, tire a foto com o celular na horizontal.
            </p>
          </div>
        )}
      </div>

      {(previewUrl || isUploading) && (
        <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="text-destructive hover:border-destructive/80 hover:bg-destructive/10 mt-2">
          <X className="mr-2 h-4 w-4" /> {isUploading ? 'Cancelar Upload' : 'Remover Imagem'}
        </Button>
      )}
    </div>
  );
}
