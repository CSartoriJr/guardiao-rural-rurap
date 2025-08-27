
'use client';
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileUp, X, Loader2, AlertCircle, FileCheck2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/services/imageUploadService'; // Reusing for generic file upload
import type { UploadTask } from 'firebase/storage';

interface FileUploadInputProps {
  onUploadComplete: (url: string | null) => void;
  onUploadStart?: () => void;
  id: string;
  currentFileUrl?: string | null;
  uploadPath: string;
  acceptedFileTypes?: string[]; // e.g., ['application/pdf']
  fileTypeDescription?: string; // e.g., 'PDF'
  maxFileSizeMB?: number;
}

export default function FileUploadInput({
  onUploadComplete,
  onUploadStart,
  id,
  currentFileUrl,
  uploadPath,
  acceptedFileTypes = ['application/pdf'],
  fileTypeDescription = 'PDF',
  maxFileSizeMB = 5,
}: FileUploadInputProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null);
  
  const { toast } = useToast();
  
  const displayUrl = currentFileUrl;

  useEffect(() => {
    // Cleanup function to cancel ongoing upload if the component unmounts.
    return () => {
      if (uploadTaskRef.current) {
        console.log(`[FileUploadInput] Component unmounting, cancelling upload for ${id}`);
        uploadTaskRef.current.cancel();
      }
    };
  }, [id]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // Reset input to allow re-selecting the same file

    if (!file) return;
    
    setError(null);
    setUploadProgress(0);
    setIsUploading(true);
    setFileName(file.name);
    onUploadStart?.();
    
    if (acceptedFileTypes && !acceptedFileTypes.includes(file.type.toLowerCase())) {
      const errorMsg = `Tipo inválido. Use ${fileTypeDescription}.`;
      toast({ title: 'Arquivo Inválido', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsUploading(false);
      return;
    }

    if (file.size > maxFileSizeMB * 1024 * 1024) {
      const errorMsg = `Arquivo muito grande (máximo ${maxFileSizeMB}MB).`;
      toast({ title: 'Arquivo Muito Grande', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsUploading(false);
      return;
    }

    if (!uploadPath) {
      const errorMsg = 'Caminho de upload não definido.';
      toast({ title: 'Erro de Configuração', description: errorMsg, variant: 'destructive' });
      setError(errorMsg);
      setIsUploading(false);
      return;
    }

    try {
      const { uploadTask, promise: uploadPromise } = uploadFile(
        file,
        uploadPath,
        (percentage) => setUploadProgress(percentage)
      );
      
      uploadTaskRef.current = uploadTask;
      const downloadURL = await uploadPromise;
      onUploadComplete(downloadURL);
      toast({ title: 'Upload Concluído', description: `Seu arquivo ${file.name} foi enviado.` });

    } catch (uploadError: any) {
      const isCancelled = uploadError.code === 'storage/canceled';
      if (isCancelled) {
        setError('Upload cancelado.');
      } else {
        const errorMsg = uploadError.message || 'Ocorreu um erro ao enviar o arquivo.';
        setError(errorMsg);
        toast({ title: 'Falha no Upload', description: errorMsg, variant: 'destructive' });
      }
      onUploadComplete(null);
    } finally {
      setIsUploading(false);
      uploadTaskRef.current = null;
    }
  };
  
  const handleRemoveOrCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
    }
    setError(null);
    setUploadProgress(0);
    setFileName(null);
    onUploadComplete(null);
    if (displayUrl) {
      toast({ title: 'Arquivo Removido' });
    }
  };
  
  return (
    <div className="w-full">
      <Input
        ref={fileInputRef}
        type="file"
        id={id}
        name={id}
        className="hidden"
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileChange}
        disabled={isUploading}
        aria-hidden="true"
      />

      {isUploading ? (
        <div className="flex flex-col items-center justify-center p-2 text-center border rounded-md">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground truncate w-full px-2" title={fileName || 'Enviando...'}>{fileName || 'Enviando...'}</p>
            <div className="w-full px-4 mt-1 relative">
                <Progress value={uploadProgress} className="h-4" />
                <p className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-primary-foreground">{uploadProgress.toFixed(0)}%</p>
            </div>
             <Button variant="outline" size="sm" onClick={handleRemoveOrCancel} className="mt-2 text-destructive hover:border-destructive/80 hover:bg-destructive/10">
                <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
        </div>
      ) : error ? (
        <div className="p-2 text-center text-destructive border border-destructive rounded-md">
            <AlertCircle className="mx-auto h-8 w-8" />
            <p className="mt-1 text-xs font-medium break-words">{error}</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { setError(null); fileInputRef.current?.click(); }}>
              Tentar Novamente
            </Button>
        </div>
      ) : displayUrl ? (
        <div className="flex items-center justify-between p-2 border rounded-md bg-green-50 border-green-200">
            <div className="flex items-center gap-2 truncate">
                <FileCheck2 className="h-5 w-5 text-green-600 shrink-0" />
                <span className="text-sm text-green-800 truncate" title={fileName || 'Arquivo enviado'}>{fileName || 'Arquivo enviado'}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveOrCancel} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                <X className="h-4 w-4" />
            </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <FileUp className="mr-2 h-4 w-4" />
            Enviar Laudo ({fileTypeDescription})
        </Button>
      )}
    </div>
  );
}
