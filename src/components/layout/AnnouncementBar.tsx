
// src/components/layout/AnnouncementBar.tsx
'use client';

import Link from 'next/link';
import type { SiteSettings } from '@/lib/types';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface AnnouncementBarProps {
  settings: Pick<
    SiteSettings,
    | 'announcement_bar_text'
    | 'announcement_bar_link_url'
    | 'announcement_bar_link_text'
    | 'announcement_bar_is_active'
    | 'announcement_bar_bg_color'
    | 'announcement_bar_text_color'
  >;
}

const SESSION_STORAGE_KEY = 'propspot_announcement_dismissed';

export default function AnnouncementBar({ settings }: AnnouncementBarProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Iniciar como "dismissed" para SSR

  useEffect(() => {
    // En el cliente, verificar si fue descartado en esta sesión
    const dismissedInSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    setIsDismissed(dismissedInSession === 'true');
  }, []);

  if (
    !settings.announcement_bar_is_active ||
    !settings.announcement_bar_text ||
    isDismissed // No renderizar si fue descartado
  ) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  const bgColor = settings.announcement_bar_bg_color || '#FFB74D'; // Accent
  const textColor = settings.announcement_bar_text_color || '#18181b'; // Dark foreground

  const hasLink = settings.announcement_bar_link_url && settings.announcement_bar_link_text;

  return (
    <div
      style={{ backgroundColor: bgColor, color: textColor }}
      className="w-full py-2.5 px-4 text-center text-sm font-medium relative"
      role="banner"
    >
      <div className="container mx-auto flex items-center justify-center gap-x-2 gap-y-1 flex-wrap">
        <span>{settings.announcement_bar_text}</span>
        {hasLink && (
          <Link
            href={settings.announcement_bar_link_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80 transition-opacity font-semibold"
            style={{ color: textColor }} 
          >
            {settings.announcement_bar_link_text}
          </Link>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-current"
        style={{ color: textColor }}
        aria-label="Descartar anuncio"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
