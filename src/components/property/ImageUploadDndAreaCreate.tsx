// src/components/property/ImageUploadDndAreaCreate.tsx
'use client';

import React from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ManagedImageCreate {
  id: string;
  url: string;
  file: File; // For create, file is always present for new images
  isNew: true;
}

interface ImageUploadDndAreaCreateProps {
  droppableId: string;
  managedImages: ManagedImageCreate[];
  onDragEnd: (result: DropResult) => void;
  removeImage: (id: string) => void;
  isUploading: boolean;
}

export default function ImageUploadDndAreaCreate({
  droppableId,
  managedImages,
  onDragEnd,
  removeImage,
  isUploading,
}: ImageUploadDndAreaCreateProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={droppableId} direction="horizontal" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="mb-4 flex gap-3 overflow-x-auto py-2"
          >
            {managedImages.map((managedImage, index) => (
              <Draggable key={managedImage.id} draggableId={managedImage.id} index={index}>
                {(providedDraggable, snapshot) => (
                  <div
                    ref={providedDraggable.innerRef}
                    {...providedDraggable.draggableProps}
                    {...providedDraggable.dragHandleProps}
                    className={cn(
                      "relative group w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 border rounded-lg overflow-hidden shadow-sm bg-slate-100",
                      snapshot.isDragging && "ring-2 ring-primary shadow-xl"
                    )}
                  >
                    <Image src={managedImage.url} alt={`Previsualización ${index + 1}`} fill style={{ objectFit: 'cover' }} data-ai-hint="propiedad interior"/>
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md z-10" onClick={() => removeImage(managedImage.id)} disabled={isUploading} aria-label="Eliminar imagen" > <Trash2 className="h-3.5 w-3.5" /> </Button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs p-0.5 rounded-sm flex items-center opacity-0 group-hover:opacity-100 transition-opacity" title="Arrastrar para reordenar">
                      <GripVertical className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
