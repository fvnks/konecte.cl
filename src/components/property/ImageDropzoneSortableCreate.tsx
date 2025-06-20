// src/components/property/ImageDropzoneSortableCreate.tsx
'use client';

import { useCallback, useState, useEffect, useId } from 'react';
import { useDropzone } from 'react-dropzone';
import { ReactSortable } from 'react-sortablejs';
// import Image from 'next/image'; // No longer using next/image here
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;

export interface SortableImageItem {
  id: string;
  file: File;
  preview: string;
}

interface ImageDropzoneSortableCreateProps {
  onImagesChange: (filesInOrder: File[]) => void;
  initialImages?: File[];
  maxImages?: number;
}

export default function ImageDropzoneSortableCreate({
  onImagesChange,
  initialImages = [],
  maxImages = MAX_IMAGES,
}: ImageDropzoneSortableCreateProps) {
  const [images, setImages] = useState<SortableImageItem[]>([]);
  const { toast } = useToast();
  const dropzoneId = useId();

  useEffect(() => {
    if (initialImages.length > 0 && images.length === 0) {
      const initialSortableImages = initialImages.map((file, index) => ({
        id: `initial-${index}-${Date.now()}`,
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages(initialSortableImages);
    }
    // Cleanup for previews created by this component instance
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImages]); // initialImages dependency is correct for initial setup

  useEffect(() => {
    onImagesChange(images.map(img => img.file));
    // No revocar aquí, se hace en el unmount del componente o si initialImages cambia.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

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

    if (acceptedFiles.length > availableSlots) {
      toast({
        title: "Límite de Imágenes Excedido",
        description: `Solo puedes subir ${availableSlots} imagen(es) más (máximo ${maxImages}). Se han añadido las primeras ${availableSlots}.`,
        variant: "warning",
      });
    }

    const newImages = acceptedFiles.slice(0, availableSlots).map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
  }, [images.length, maxImages, toast]); // images.length is the correct dependency here

  const removeImage = (idToRemove: string) => {
    setImages(prevImages => {
      const imageToRemove = prevImages.find(img => img.id === idToRemove);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prevImages.filter(img => img.id !== idToRemove);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    maxFiles: maxImages, // This might not be strictly enforced if adding one by one, but good to have
    disabled: images.length >= maxImages,
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
            images.length >= maxImages && "cursor-not-allowed opacity-60 hover:border-muted-foreground/30"
          )}
        >
          <input {...getInputProps()} id={dropzoneId} />
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
          setList={setImages}
          tag="div"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 py-2"
          animation={150}
          // removed handle prop to make entire item draggable
        >
          {images.map((img, index) => (
            <div
              key={img.id}
              className="relative group aspect-square border rounded-lg overflow-hidden shadow-sm bg-slate-100 cursor-grab active:cursor-grabbing"
            >
              <img
                src={img.preview}
                alt={`Previsualización ${img.file.name}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                data-ai-hint="propiedad interior"
              />
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
