'use client';

import { createGroupAction } from '@/actions/groupActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const initialState = {
  success: false,
  message: '',
};

export default function CreateGroupForm() {
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.push('/dashboard/my-groups');
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setState({ success: false, message: '' });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = fileInputRef.current?.files?.[0];
    let avatarUrl = '';

    if (file) {
      try {
        const response = await fetch(`/api/groups/avatar/upload?filename=${file.name}`, {
          method: 'POST',
          body: file,
        });

        if (!response.ok) {
          throw new Error('Error al subir la imagen.');
        }

        const newBlob = await response.json();
        avatarUrl = newBlob.url;
      } catch (error) {
        setState({ success: false, message: 'Fallo al subir la imagen. Intenta de nuevo.' });
        setPending(false);
        return;
      }
    }

    formData.append('avatarUrl', avatarUrl);
    
    // Llamar a la server action
    const result = await createGroupAction(initialState, formData);
    setState(result);
    setPending(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Crear un nuevo grupo</CardTitle>
            <CardDescription>
                Forma una asociación gremial, organiza tu equipo de corredores o crea un espacio de colaboración.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                        <label htmlFor="avatar" className="cursor-pointer">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={previewUrl} alt="Avatar del grupo" />
                                <AvatarFallback className="flex flex-col items-center justify-center space-y-1">
                                    <User className="h-8 w-8 text-gray-400" />
                                    <span className="text-xs">Subir Foto</span>
                                </AvatarFallback>
                            </Avatar>
                        </label>
                        <Input id="avatar" name="avatar" type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    <div className="space-y-4 w-full">
                        <div className="space-y-2">
                            <label htmlFor="name" className="font-medium">Nombre del Grupo</label>
                            <Input id="name" name="name" placeholder="Ej: Corredores de la V Región" required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="description" className="font-medium">Descripción (Opcional)</label>
                            <Textarea id="description" name="description" placeholder="Una breve descripción de los objetivos y miembros del grupo." />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                    <Label className="text-base font-semibold">Insignia del Grupo en Publicaciones</Label>
                    <p className="text-sm text-muted-foreground">
                        Elige cómo se mostrará este grupo en las publicaciones de sus miembros (si lo eligen como su grupo principal).
                    </p>
                    <RadioGroup name="postBadgeType" defaultValue="none" className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="logo" id="r-logo" />
                            <Label htmlFor="r-logo" className="flex items-center gap-2 font-normal">
                                Mostrar logo del grupo <Badge variant="secondary">Recomendado</Badge>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="name" id="r-name" />
                            <Label htmlFor="r-name" className="font-normal">Mostrar nombre del grupo</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="r-none" />
                            <Label htmlFor="r-none" className="font-normal">No mostrar insignia</Label>
                        </div>
                    </RadioGroup>
                </div>
                
                <div className="flex justify-end">
                    <Button type="submit" disabled={pending}>{pending ? 'Creando grupo...' : 'Crear Grupo'}</Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
} 