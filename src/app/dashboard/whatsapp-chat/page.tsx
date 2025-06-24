// src/app/dashboard/whatsapp-chat/page.tsx
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { HardHat } from "lucide-react";

export default function WhatsAppChatPage() {
  return (
    <Card className="h-[calc(100vh-4rem)] shadow-lg">
      <CardContent className="h-full p-0">
        <div className="flex h-full flex-col items-center justify-center text-center p-6 bg-muted/40">
          <HardHat className="h-16 w-16 text-primary mb-6" />
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Herramienta en Construcción
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Estamos trabajando para integrar nuestro asistente de IA directamente en esta pantalla. ¡Vuelve pronto para ver las novedades!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
