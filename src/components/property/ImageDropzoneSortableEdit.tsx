// src/components/property/ImageDropzoneSortableEdit.tsx
'use client';

import { useCallback, useState, useEffect, useId, useRef } from 'react'; // Added useRef
import { useDropzone } from 'react-dropzone';
import { ReactSortable } from 'react-sortablejs';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;

export interface ManagedImageForEdit {
  id: string;
  url: string; // Can be http(s) URL for existing, or blob:URL for new
  file?: File; // Only for new files
  isExisting: boolean;
  originalUrl?: string; // Store original http(s) URL for existing images
}

interface ImageDropzoneSortableEditProps {
  initialImageUrls: string[];
  onManagedImagesChange: (images: ManagedImageForEdit[]) => void;
  maxImages?: number;
}

export default function ImageDropzoneSortableEdit({
  initialImageUrls,
  onManagedImagesChange,
  maxImages = MAX_IMAGES,
}: ImageDropzoneSortableEditProps) {
  const [managedImages, setManagedImages] = useState<ManagedImageForEdit[]>([]);
  const { toast } = useToast();
  const dropzoneId = useId();
  const createdBlobUrlsRef = useRef<string[]>([]); // Tracks only blob URLs created by this instance

  useEffect(() => {
    // Initialize with existing images
    const initialProcessedImages = initialImageUrls.map((url, index) => ({
      id: `existing-${url.slice(-10)}-${index}-${Date.now()}`, // More unique ID
      url: url,
      isExisting: true,
      originalUrl: url,
    }));
    setManagedImages(initialProcessedImages);
    // No blob URLs created from initialImageUrls, so createdBlobUrlsRef remains empty here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImageUrls]); // Rerun only if initialImageUrls fundamentally changes

  // Effect to notify parent form of changes
  useEffect(() => {
    onManagedImagesChange(managedImages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managedImages]); // onManagedImagesChange is memoized usually

  // Unmount cleanup for blob URLs
  useEffect(() => {
    return () => {
      createdBlobUrlsRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      createdBlobUrlsRef.current = [];
    };
  }, []); // Empty dependency array for unmount only

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const currentImageCount = managedImages.length;
    const availableSlots = maxImages - currentImageCount;

    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejectedFile: any) => {
        rejectedFile.errors.forEach((error: any) => {
          let message = `Error al subir "${rejectedFile.file.name}": ${error.message}`;
          if (error.code === 'file-too-large') message = `"${rejectedFile.file.name}" excede ${MAX_FILE_SIZE_MB}MB.`;
          else if (error.code === 'file-invalid-type') message = `"${rejectedFile.file.name}" no es válido.`;
          toast({ title: "Archivo Rechazado", description: message, variant: "destructive" });
        });
      });
    }

    if (acceptedFiles.length > availableSlots) {
      toast({
        title: "Límite Excedido",
        description: `Solo puedes subir ${availableSlots} más (máx. ${maxImages}). Se añadieron las primeras ${availableSlots}.`,
        variant: "warning",
      });
    }

    const newImagesToAdd: ManagedImageForEdit[] = [];
    const newBlobUrlsForThisDrop: string[] = [];

    acceptedFiles.slice(0, availableSlots).forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      newBlobUrlsForThisDrop.push(previewUrl);
      newImagesToAdd.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        url: previewUrl, // This is the blob:URL
        isExisting: false,
      });
    });
    
    if (newImagesToAdd.length > 0) {
      setManagedImages(prev => [...prev, ...newImagesToAdd]);
      createdBlobUrlsRef.current = [...createdBlobUrlsRef.current, ...newBlobUrlsForThisDrop];
    }
  }, [managedImages.length, maxImages, toast]);

  const removeImage = (idToRemove: string) => {
    setManagedImages(prevImages => {
      const imageToRemove = prevImages.find(img => img.id === idToRemove);
      if (imageToRemove && !imageToRemove.isExisting && imageToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
        createdBlobUrlsRef.current = createdBlobUrlsRef.current.filter(url => url !== imageToRemove.url);
      }
      return prevImages.filter(img => img.id !== idToRemove);
    });
  };
  
  const onSortEnd = (newSortedList: ManagedImageForEdit[]) => {
    setManagedImages(newSortedList);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    disabled: managedImages.length >= maxImages,
  });

  return (
    <div className="space-y-3">
      {managedImages.length < maxImages && (
         <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            "bg-muted/20 hover:bg-muted/40 border-muted-foreground/30 hover:border-primary/70",
            isDragActive && "border-primary ring-2 ring-primary",
            managedImages.length >= maxImages && "cursor-not-allowed opacity-60 hover:border-muted-foreground/30"
          )}
        >
          <input {...getInputProps()} id={dropzoneId} />
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="mb-1 text-base text-muted-foreground">
              <span className="font-semibold text-primary">Añadir más imágenes</span> o arrastra y suelta
            </p>
            <p className="text-xs text-muted-foreground">
              (Máx. {maxImages - managedImages.length} más, hasta {MAX_FILE_SIZE_MB}MB c/u)
            </p>
          </div>
        </div>
      )}
      {managedImages.length >= maxImages && (
        <div className="p-3 text-sm text-center bg-amber-100 border border-amber-300 text-amber-700 rounded-md flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4"/> Has alcanzado el límite de {maxImages} imágenes.
        </div>
      )}

      {managedImages.length > 0 && (
        <ReactSortable
          list={managedImages}
          setList={onSortEnd} // Use the updated handler
          tag="div"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 py-2"
          animation={150}
        >
          {managedImages.map((img, index) => (
            <div
              key={img.id} // Ensure key is stable and unique
              className="relative group aspect-square border rounded-lg overflow-hidden shadow-sm bg-slate-100 cursor-grab active:cursor-grabbing"
            >
              <img
                src={img.url} // This will be blob URL for new, http URL for existing
                alt={`Previsualización ${img.id}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: 'rgba(0,0,0,0.05)' }}
                data-ai-hint="propiedad interior"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md z-10"
                onClick={(e) => { e.stopPropagation(); removeImage(img.id);}}
                aria-label="Eliminar imagen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              {index === 0 && (
                <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                  Principal
                </span>
              )}
            </div>
          ))}
        </ReactSortable>
      )}
    </div>
  );
}
