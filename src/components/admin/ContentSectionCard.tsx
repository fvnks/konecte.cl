import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import StaticText from '@/components/ui/StaticText';

interface ContentSectionCardProps {
  id: string;
  title: string;
  defaultValue?: string;
  onSave: (id: string, content: string) => void;
  isSaving?: boolean;
}

export default function ContentSectionCard({ id, title, defaultValue = '', onSave, isSaving = false }: ContentSectionCardProps) {
  const [content, setContent] = useState(defaultValue);
  
  const handleSave = () => {
    onSave(id, content);
  };
  
  return (
    <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-medium text-lg mb-1">{title}</h3>
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