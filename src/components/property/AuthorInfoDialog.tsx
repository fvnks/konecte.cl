// src/components/property/AuthorInfoDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Mail, Phone, UserCircle, ShieldCheck, Lock, Loader2, X } from 'lucide-react';
import type { User as StoredUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import styled from 'styled-components';
import { Card } from '@/components/ui/card';

interface AuthorInfoDialogProps {
  author: StoredUser;
  children: React.ReactNode;
}

const StyledWrapper = styled.div`
    /* This component uses styled-components for the complex card design provided by the user */
    .profile-card {
        width: 320px;
        border-radius: 0.75rem; /* Matches ShadCN's rounded-md */
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05); /* shadow-lg */
        overflow: hidden;
        background-color: hsl(var(--card));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 1rem;
        transition: all 0.3s ease-in-out;
        color: hsl(var(--foreground));
        border: 1px solid hsl(var(--border));
        padding-bottom: 0; /* Remove bottom padding to let hr touch the bottom */
        position: relative; /* Added for absolute positioning of close button */
    }
    
    .avatar {
        width: 100%;
        padding-top: 1.25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
    }

    .img_container {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 40;
    }

    /* The blue animated bars */
    .img_container::before, .img_container::after {
        content: "";
        position: absolute;
        height: 6px;
        width: 100%;
        background-color: hsl(var(--primary));
        transition: all 0.3s ease-in-out;
    }

    .img_container::before {
        top: 1rem; /* 16px */
    }

    .img_container::after {
        bottom: 1rem; /* 16px */
    }

    .profile-card:hover .img_container::before,
    .profile-card:hover .img_container::after {
        width: 1%;
        transition-delay: 0s;
    }

    .avatar-svg-container {
        width: 9rem; /* 144px */
        height: 9rem; /* 144px */
        position: relative;
        z-index: 40;
    }

    .avatar-svg-container svg {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 4px solid hsl(var(--card));
        transition: border-width 0.3s ease-in-out;
    }

    .profile-card:hover .avatar-svg-container svg {
        border-width: 8px;
    }
    
    /* Blue background behind avatar */
    .avatar-bg-effect {
        position: absolute;
        background-color: hsl(var(--primary));
        z-index: 10;
        width: 100%;
        height: 60%;
        transition: height 0.3s ease-in-out;
        transition-delay: 0.7s;
    }
    
    .profile-card:hover .avatar-bg-effect {
        height: 1%;
        transition-delay: 0s;
    }

    .headings {
        text-align: center;
        line-height: 1;
        width: 100%;
        padding: 0 1rem;
    }

    .headings .user-name {
        font-size: 1.25rem; /* xl */
        font-weight: 600;
        color: hsl(var(--foreground));
    }

    .headings .user-role {
        font-size: 0.875rem; /* sm */
        font-weight: 500;
        color: hsl(var(--muted-foreground));
        margin-top: 0.25rem;
    }

    .info-list-container {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 1rem; /* p-3 */
        min-height: 100px;
    }

    .info-list {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem; /* gap-2 */
        width: 100%;
    }
    
    .info-list li {
        display: inline-flex;
        gap: 0.5rem; /* gap-2 */
        align-items: center;
        justify-content: flex-start;
        font-size: 0.875rem; /* text-sm */
        font-weight: 500;
        color: hsl(var(--muted-foreground));
    }

    .info-list li svg {
        width: 1rem; /* size-4 */
        height: 1rem; /* size-4 */
        color: hsl(var(--primary));
        flex-shrink: 0;
    }
    
    .info-list li p {
      word-break: break-all;
    }

    .info-list li a {
      color: hsl(var(--primary));
      text-decoration: none;
    }
    .info-list li a:hover {
      text-decoration: underline;
    }

    .bottom-bar {
        width: 100%;
        height: 0.75rem; /* h-3 */
        background-color: hsl(var(--primary));
        transition: height 0.3s ease-in-out;
    }

    .profile-card:hover .bottom-bar {
        height: 1.25rem; /* h-5 */
    }
`;

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

    useEffect(() => {
        if (!isOpen) return;

        setIsLoadingViewer(true);
        const userJson = localStorage.getItem('loggedInUser');
        if (userJson) {
            try {
                const parsedViewer: StoredUser = JSON.parse(userJson);
                setViewerUser(parsedViewer);
                
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
    const authorRoleDisplay = getRoleDisplayName(author?.role_id, author?.role_name);
    const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 1).toUpperCase();

    const renderContactInfo = () => {
        if (isLoadingViewer) {
            return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />;
        }
        if (canViewContact) {
            const hasContactInfo = author.email || author.phone_number;
            return (
                <ul className="info-list">
                    {author.email && (
                        <li>
                            <Mail /> <a href={`mailto:${author.email}`}>{author.email}</a>
                        </li>
                    )}
                    {author.phone_number && (
                        <li>
                            <Phone /> <a href={`tel:${author.phone_number}`}>{author.phone_number}</a>
                        </li>
                    )}
                    {!hasContactInfo && (
                        <li className="italic">El usuario no ha proporcionado datos de contacto directo.</li>
                    )}
                </ul>
            );
        }
        return (
            <Card className="bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700 p-3 w-full">
                <div className="flex items-start gap-3">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm">
                            Contacto Protegido
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                            {viewerUser ? "Mejora tu plan para ver los datos de contacto." : "Inicia sesión para ver si puedes acceder."}
                        </p>
                        <Button asChild variant="link" size="sm" className="p-0 h-auto mt-1.5 text-xs text-amber-800 dark:text-amber-300">
                            <Link href={viewerUser ? "/plans" : "/auth/signin"}>
                                {viewerUser ? "Ver Planes" : "Iniciar Sesión"}
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true) }}>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs p-0 bg-transparent border-none shadow-none">
                <StyledWrapper>
                    <div className="profile-card group">
                        <DialogClose asChild>
                            <button 
                                className="absolute top-3 right-3 z-50 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground bg-card/50 hover:bg-black/10 hover:text-foreground transition-colors"
                                aria-label="Cerrar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </DialogClose>
                        <div className="avatar">
                            <div className="img_container">
                                <div className="avatar-bg-effect" />
                                <div className="avatar-svg-container">
                                    <svg id="avatar" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                        <circle fill="hsl(var(--primary))" r="512" cy="512" cx="512" />
                                        <text x="512" y="580" fontSize="550" fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="middle" fontWeight="600">
                                            {authorInitials || <UserCircle/>}
                                        </text>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="headings">
                            <p className="user-name">{authorName}</p>
                            {authorRoleDisplay && <p className="user-role">{authorRoleDisplay}</p>}
                        </div>
                        <div className="info-list-container">
                            {renderContactInfo()}
                        </div>
                        <hr className="bottom-bar" />
                    </div>
                </StyledWrapper>
            </DialogContent>
        </Dialog>
    );
}