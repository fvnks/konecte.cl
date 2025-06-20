// src/components/property/ImageUploadDndAreaCreate.tsx
'use client';

import { useCallback, useState, useEffect, useId, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { ReactSortable } from 'react-sortablejs';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;

export interface SortableImageItem {
  id: string;
  file: File;
  url: string; // This will be a blob:URL
}

interface ImageUploadDndAreaCreateProps {
  onImagesChange: (filesInOrder: File[]) => void;
  initialImages?: File[];
  maxImages?: number;
  isSubmittingForm?: boolean; // To disable dropzone during form submission
}

export default function ImageUploadDndAreaCreate({
  onImagesChange,
  initialImages = [],
  maxImages = MAX_IMAGES,
  isSubmittingForm = false,
}: ImageUploadDndAreaCreateProps) {
  const [images, setImages] = useState<SortableImageItem[]>([]);
  const { toast } = useToast();
  const dropzoneId = useId();
  const createdBlobUrlsRef = useRef<string[]>([]);

  // Effect to handle initial images passed as props (e.g., if form retains state after error)
  useEffect(() => {
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
    // This effect should only run if initialImages changes or on first load if initialImages is provided.
    // It shouldn't depend on 'images' itself to avoid loops if not careful.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImages, maxImages]);


  // Effect to call onImagesChange whenever the 'images' state changes
  useEffect(() => {
    onImagesChange(images.map(img => img.file));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]); // onImagesChange can be unstable if not memoized, but for this use case it's generally fine.

  // Effect to clean up blob URLs when the component unmounts
  useEffect(() => {
    return () => {
      createdBlobUrlsRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      createdBlobUrlsRef.current = [];
    };
  }, []); // Empty dependency array, runs only on mount and unmount.


  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
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
      setImages(prev => [...prev, ...newSortableImages]);
      createdBlobUrlsRef.current = [...createdBlobUrlsRef.current, ...newBlobUrlsForThisDrop];
    }
  }, [images.length, maxImages, toast]);

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
    disabled: images.length >= maxImages || isSubmittingForm,
  });

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
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 py-2"
          animation={150}
        >
          {images.map((img, index) => (
            <div
              key={img.id}
              data-id={img.id}
              className="relative group aspect-square border rounded-lg overflow-hidden shadow-sm bg-slate-100 cursor-grab active:cursor-grabbing"
            >
              {img.url && (
                <img
                  src={img.url}
                  alt={`Previsualización ${img.file.name}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: 'rgba(0,0,0,0.05)' }}
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
          ))}
        </ReactSortable>
      )}
    </div>
  );
}
