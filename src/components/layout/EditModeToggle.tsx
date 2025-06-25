'use client';

import React from 'react';
import { useEditMode } from '@/lib/EditModeContext';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Pencil } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EditModeToggleProps {
  className?: string;
}

export default function EditModeToggle({ className }: EditModeToggleProps) {
  const { isEditMode, toggleEditMode, isAdmin } = useEditMode();
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            <Pencil 
              className={cn(
                "h-4 w-4 transition-colors", 
                isEditMode ? "text-primary" : "text-muted-foreground"
              )} 
            />
            <Switch 
              checked={isEditMode} 
              onCheckedChange={toggleEditMode}
              className="data-[state=checked]:bg-primary"
              aria-label="Activar/desactivar modo edición"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isEditMode ? 'Desactivar' : 'Activar'} modo edición</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 