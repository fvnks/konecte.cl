// src/components/property/AuthorInfoDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, UserCircle, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import type { User as StoredUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface AuthorInfoDialogProps {
  author: StoredUser;
  children: React.ReactNode;
}

const getRoleDisplayName = (roleId?: string, roleName?: string): string | null => {
    if (roleName) return roleName;
    if (roleId === 'user') return 'Usuario';
    if (roleId === 'broker') return 'Corredor';
    if (roleId === 'admin') return 'Admin';
    return roleId || null;
};

export default function AuthorInfoDialog({ author, children }: AuthorInfoDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewerUser, setViewerUser] = useState<StoredUser | null>(null);
    const [canViewContact, setCanViewContact] = useState(false);
    const [isLoadingViewer, setIsLoadingViewer] = useState(true);

    // This effect runs only when the dialog is opened to check permissions.
    useEffect(() => {
        if (!isOpen) return;

        setIsLoadingViewer(true);
        const userJson = localStorage.getItem('loggedInUser');
        if (userJson) {
            try {
                const parsedViewer: StoredUser = JSON.parse(userJson);
                setViewerUser(parsedViewer);
                
                // Permission logic
                if (parsedViewer && author && parsedViewer.id === author.id) {
                    setCanViewContact(true);
                } else if (parsedViewer && parsedViewer.plan_allows_contact_view) {
                    setCanViewContact(true);
                } else {
                    setCanViewContact(false);
                }
            } catch (e) {
                console.error("Error parsing viewer user:", e);
                setViewerUser(null);
                setCanViewContact(false);
            }
        } else {
            setViewerUser(null);
            setCanViewContact(false);
        }
        setIsLoadingViewer(false);
    }, [isOpen, author]);

    const authorName = author?.name || "Anunciante";
    const authorAvatar = author?.avatarUrl;
    const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    const authorRoleDisplay = getRoleDisplayName(author?.role_id, author?.role_name);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild onClick={(e) => {e.preventDefault(); e.stopPropagation(); setIsOpen(true)}}>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center items-center gap-2">
                    <Avatar className="h-20 w-20 mb-2 border-2 border-primary/20">
                        <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="persona perfil"/>
                        <AvatarFallback className="text-2xl bg-muted">{authorInitials || <UserCircle />}</AvatarFallback>
                    </Avatar>
                    <DialogTitle className="text-xl">{authorName}</DialogTitle>
                    {authorRoleDisplay && (
                         <Badge variant="outline" className="capitalize text-xs">
                            <ShieldCheck className="h-3 w-3 mr-1"/> {authorRoleDisplay}
                        </Badge>
                    )}
                </DialogHeader>
                <div className="py-4 min-h-[100px] flex items-center justify-center">
                    {isLoadingViewer ? (
                         <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : canViewContact ? (
                        <div className="space-y-3 w-full">
                           <h4 className="font-semibold text-center text-sm text-muted-foreground">Información de Contacto</h4>
                           {author.email && <p className="text-base flex items-center gap-2.5 p-2 bg-secondary/50 rounded-md"><Mail className="h-4 w-4 text-primary"/>{author.email}</p>}
                           {author.phone_number && <p className="text-base flex items-center gap-2.5 p-2 bg-secondary/50 rounded-md"><Phone className="h-4 w-4 text-primary"/>{author.phone_number}</p>}
                           {(!author.email && !author.phone_number) && <p className="text-sm italic text-muted-foreground text-center">El usuario no ha proporcionado datos de contacto directo.</p>}
                        </div>
                    ) : (
                        <Card className="bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700 p-4 w-full">
                          <div className="flex items-start gap-3">
                            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-amber-800 dark:text-amber-400">
                                Contacto Protegido
                              </p>
                              <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                                {viewerUser ? "Mejora tu plan para ver los datos de contacto." : "Inicia sesión para ver si puedes acceder a los datos de contacto."}
                              </p>
                              <Button asChild variant="link" size="sm" className="p-0 h-auto mt-2 text-amber-800 dark:text-amber-300">
                                <Link href={viewerUser ? "/plans" : "/auth/signin"}>
                                  {viewerUser ? "Ver Planes" : "Iniciar Sesión"}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
