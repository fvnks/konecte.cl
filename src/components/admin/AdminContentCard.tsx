import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';

interface AdminContentCardProps {
  id: string;
  title: string;
  defaultValue?: string;
  onSave: (id: string, content: string) => void;
  isSaving?: boolean;
}

// Mapeo de títulos en inglés a español
const titleTranslations: Record<string, string> = {
  'Content Title': 'Título de Contenido',
  'Dashboard Title': 'Título del Panel',
  'Properties Title': 'Título de Propiedades',
  'Requests Title': 'Título de Solicitudes',
  'Settings Title': 'Título de Configuración',
  'Users Title': 'Título de Usuarios',
};

export default function AdminContentCard({ id, title, defaultValue = '', onSave, isSaving = false }: AdminContentCardProps) {
  const [content, setContent] = useState(defaultValue);
  
  // Traducir el título si existe en el mapeo, de lo contrario usar el título original
  const translatedTitle = titleTranslations[title] || title;
  
  const handleSave = () => {
    onSave(id, content);
  };
  
  return (
    <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-medium text-lg mb-1">{translatedTitle}</h3>
      <div className="text-sm text-muted-foreground mb-3">
        ID: <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{id}</span>
      </div>
      <textarea
        className="w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="Ingresa el contenido aquí..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      ></textarea>
      <div className="flex justify-end mt-3">
        <Button 
          variant="default" 
          size="sm"
          className="flex items-center"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </Card>
  );
} 