// src/components/property/ImageDropzoneSortableCreate.tsx
'use client';

import { useCallback, useState, useEffect, useId, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { ReactSortable } from 'react-sortablejs';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;

export interface SortableImageItem {
  id: string;
  file: File;
  url: string; // This will be a blob:URL
}

interface ImageDropzoneSortableCreateProps {
  onImagesChange: (filesInOrder: File[]) => void;
  initialImages?: File[];
  maxImages?: number;
  isSubmittingForm?: boolean; 
}

export default function ImageDropzoneSortableCreate({
  onImagesChange,
  initialImages = [],
  maxImages = MAX_IMAGES,
  isSubmittingForm = false,
}: ImageDropzoneSortableCreateProps) {
  const [images, setImages] = useState<SortableImageItem[]>([]);
  const { toast } = useToast();
  const dropzoneId = useId();
  const createdBlobUrlsRef = useRef<string[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    if (initialImages.length > 0 && images.length === 0) {
      const newInitialSortableImages: SortableImageItem[] = [];
      const newBlobUrls: string[] = [];

      initialImages.forEach((file, index) => {
        if (newInitialSortableImages.length < maxImages) {
          try {
            const previewUrl = URL.createObjectURL(file);
            newBlobUrls.push(previewUrl);
            newInitialSortableImages.push({
              id: `initial-${file.name}-${index}-${Date.now()}`,
              file,
              url: previewUrl,
            });
          } catch (error) {
            console.error("Error creating blob URL for initial image:", file.name, error);
          }
        }
      });
      setImages(newInitialSortableImages);
      createdBlobUrlsRef.current = [...createdBlobUrlsRef.current, ...newBlobUrls];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImages, maxImages, hasMounted]); 


  useEffect(() => {
    if (hasMounted) {
      onImagesChange(images.map(img => img.file));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, hasMounted]); 

  useEffect(() => {
    return () => {
      createdBlobUrlsRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      createdBlobUrlsRef.current = [];
    };
  }, []); 


  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (!hasMounted) return;
    const currentImageCount = images.length;
    const availableSlots = maxImages - currentImageCount;

    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejectedFile: any) => {
        rejectedFile.errors.forEach((error: any) => {
          let message = `Error al subir "${rejectedFile.file.name}": ${error.message}`;
          if (error.code === 'file-too-large') {
            message = `"${rejectedFile.file.name}" excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB.`;
          } else if (error.code === 'file-invalid-type') {
            message = `"${rejectedFile.file.name}" no es un tipo de imagen válido.`;
          }
          toast({ title: "Archivo Rechazado", description: message, variant: "destructive" });
        });
      });
    }

    if (acceptedFiles.length > availableSlots && availableSlots > 0) {
      toast({
        title: "Límite de Imágenes Excedido",
        description: `Solo puedes subir ${availableSlots} imagen(es) más (máximo ${maxImages}). Se han añadido las primeras ${availableSlots}.`,
        variant: "warning",
      });
    } else if (acceptedFiles.length > 0 && availableSlots <= 0) {
       toast({
        title: "Límite de Imágenes Alcanzado",
        description: `Ya has alcanzado el máximo de ${maxImages} imágenes.`,
        variant: "warning",
      });
      return;
    }

    const newSortableImages: SortableImageItem[] = [];
    const newBlobUrlsForThisDrop: string[] = [];

    acceptedFiles.slice(0, availableSlots).forEach(file => {
      try {
        const previewUrl = URL.createObjectURL(file);
        console.log(`[ImageDropzoneSortableCreate] Created blob URL for ${file.name}: ${previewUrl}`);
        newBlobUrlsForThisDrop.push(previewUrl);
        newSortableImages.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          url: previewUrl
        });
      } catch (error) {
        console.error("Error creating blob URL in onDrop:", file.name, error);
        toast({ title: "Error de Previsualización", description: `No se pudo generar la previsualización para ${file.name}.`, variant: "destructive" });
      }
    });

    if (newSortableImages.length > 0) {
      setImages(prev => {
        const updatedImages = [...prev, ...newSortableImages];
        console.log("[ImageDropzoneSortableCreate] Updated images state:", updatedImages.map(img => ({id:img.id, url:img.url, fileName: img.file?.name})));
        return updatedImages;
      });
      createdBlobUrlsRef.current = [...createdBlobUrlsRef.current, ...newBlobUrlsForThisDrop];
    }
  }, [images.length, maxImages, toast, hasMounted]);

  const removeImage = (idToRemove: string) => {
    setImages(prevImages => {
      const imageToRemove = prevImages.find(img => img.id === idToRemove);
      if (imageToRemove && imageToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
        createdBlobUrlsRef.current = createdBlobUrlsRef.current.filter(url => url !== imageToRemove.url);
      }
      return prevImages.filter(img => img.id !== idToRemove);
    });
  };

  const onSortEnd = (newSortedList: SortableImageItem[]) => {
    setImages(newSortedList);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    disabled: images.length >= maxImages || isSubmittingForm || !hasMounted,
  });

  if (!hasMounted) {
    return (
      <div className="min-h-[10rem] flex items-center justify-center w-full border-2 border-dashed rounded-lg bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando área de imágenes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            "bg-muted/20 hover:bg-muted/40 border-muted-foreground/30 hover:border-primary/70",
            isDragActive && "border-primary ring-2 ring-primary",
            (images.length >= maxImages || isSubmittingForm) && "cursor-not-allowed opacity-60 hover:border-muted-foreground/30"
          )}
        >
          <input {...getInputProps()} id={dropzoneId} disabled={isSubmittingForm}/>
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="mb-1 text-base text-muted-foreground">
              <span className="font-semibold text-primary">Añadir imágenes</span> o arrastra y suelta
            </p>
            <p className="text-xs text-muted-foreground">
              Imágenes (Máx. {maxImages - images.length} más, hasta {MAX_FILE_SIZE_MB}MB c/u)
            </p>
          </div>
        </div>
      )}
      {images.length >= maxImages && (
        <div className="p-3 text-sm text-center bg-amber-100 border border-amber-300 text-amber-700 rounded-md flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4"/> Has alcanzado el límite de {maxImages} imágenes.
        </div>
      )}

      {images.length > 0 && (
        <ReactSortable
          list={images}
          setList={onSortEnd}
          tag="div"
          className="flex flex-wrap gap-3 py-2" 
          animation={150}
        >
          {images.map((img, index) => {
            console.log(`[ImageDropzoneSortableCreate MAP] Rendering img ${index}, id: ${img.id}, url: ${img.url}`);
            return (
              <div
                key={img.id} 
                data-id={img.id} 
                className="relative group w-32 h-32 border rounded-lg overflow-hidden shadow-sm bg-slate-100 cursor-grab active:cursor-grabbing inline-block m-1"
              >
                {img.url && (
                  <img
                    src={img.url}
                    alt={`Previsualización ${img.file?.name || img.id}`}
                    className="w-full h-full object-cover"
                    style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                    data-ai-hint="propiedad interior"
                  />
                )}
                {!isSubmittingForm && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md z-10"
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    aria-label="Eliminar imagen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {index === 0 && (
                  <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                    Principal
                  </span>
                )}
              </div>
            );
          })}
        </ReactSortable>
      )}
    </div>
  );
}
