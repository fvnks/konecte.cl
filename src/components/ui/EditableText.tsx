'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditMode } from '@/lib/EditModeContext';
import { cn } from '@/lib/utils';
import { Pencil, Save, X } from 'lucide-react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Input } from './input';
import { useToast } from '@/hooks/use-toast';
import { updateEditableTextAction } from '@/actions/editableTextActions';

interface EditableTextProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  textType?: 'paragraph' | 'heading' | 'span' | 'label';
  multiline?: boolean;
}

export default function EditableText({ 
  id, 
  children, 
  className,
  textType = 'paragraph',
  multiline = false
}: EditableTextProps) {
  const { isEditMode } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Extract text content from children when component mounts or children change
  useEffect(() => {
    if (typeof children === 'string') {
      setText(children);
      setOriginalText(children);
    } else if (React.isValidElement(children)) {
      const content = React.Children.toArray(children.props.children).join('');
      setText(content);
      setOriginalText(content);
    } else if (Array.isArray(children)) {
      const content = React.Children.toArray(children).join('');
      setText(content);
      setOriginalText(content);
    }
  }, [children]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleCancel = () => {
    setText(originalText);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (text === originalText) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateEditableTextAction(id, text);
      if (result) {
        setOriginalText(text);
        toast({
          title: "Texto actualizado",
          description: "El texto se ha actualizado correctamente.",
        });
      } else {
        throw new Error("No se pudo actualizar el texto");
      }
    } catch (error) {
      console.error("Error updating text:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el texto. Inténtalo de nuevo.",
        variant: "destructive",
      });
      // Revert to original text on error
      setText(originalText);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  // If not in edit mode, render as normal
  if (!isEditMode) {
    switch (textType) {
      case 'heading':
        return <h2 className={className}>{children}</h2>;
      case 'span':
        return <span className={className}>{children}</span>;
      case 'label':
        return <label className={className}>{children}</label>;
      case 'paragraph':
      default:
        return <p className={className}>{children}</p>;
    }
  }

  // In edit mode but not actively editing
  if (!isEditing) {
    const Component = textType === 'heading' ? 'h2' : 
                      textType === 'span' ? 'span' : 
                      textType === 'label' ? 'label' : 'p';
    
    return (
      <Component 
        className={cn(
          "group relative border border-dashed border-transparent hover:border-primary/30 rounded px-1 py-0.5 cursor-pointer",
          className
        )}
        onClick={handleEdit}
        title="Haz clic para editar este texto"
      >
        {children}
        <Pencil className="absolute top-1 right-1 h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </Component>
    );
  }

  // Actively editing
  return (
    <div className="relative">
      {multiline ? (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={cn("min-h-[100px]", className)}
          autoFocus
        />
      ) : (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={className}
          autoFocus
        />
      )}
      <div className="flex gap-1 mt-1">
        <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={isSaving}
          className="h-7 px-2 py-1"
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleCancel}
          disabled={isSaving}
          className="h-7 px-2 py-1"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  );
} 