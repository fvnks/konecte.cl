// src/app/ai-matching/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { findMatchingRequestsForProperty, type FindMatchingRequestsOutput, type MatchResult as RequestMatchResult } from '@/ai/flows/find-matching-requests-flow';
import { findMatchingPropertiesForRequest, type FindMatchingPropertiesOutput, type PropertyMatchResult } from '@/ai/flows/find-matching-properties-flow';
import { getUserPropertiesAction } from '@/actions/propertyActions';
import { getUserRequestsAction } from '@/actions/requestActions';
import type { User as StoredUser, PropertyListing, SearchRequest } from '@/lib/types';
import { Loader2, Sparkles, MessageSquareText, AlertTriangle, Building, FileSearch } from "lucide-react";

// Types for aggregated results
interface PropertyWithMatches extends PropertyListing {
  matches: RequestMatchResult[];
}
interface RequestWithMatches extends SearchRequest {
  matches: PropertyMatchResult[];
}

function AiMatchingPageContent() {
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [propertyMatches, setPropertyMatches] = useState<PropertyWithMatches[]>([]);
  const [requestMatches, setRequestMatches] = useState<RequestWithMatches[]>([]);

  const fetchAllMatches = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    setPropertyMatches([]);
    setRequestMatches([]);

    try {
      const [userProperties, userRequests] = await Promise.all([
        getUserPropertiesAction(userId),
        getUserRequestsAction(userId),
      ]);
      
      const activeProperties = userProperties.filter(p => p.isActive);
      const activeRequests = userRequests.filter(r => r.isActive);

      // Fetch matches for user's properties
      const propertyMatchPromises = activeProperties.map(prop =>
        findMatchingRequestsForProperty({ propertyId: prop.id }).then(result => ({
          ...prop,
          matches: result.matches.filter(m => m.matchScore >= 0.5), // Filter for significant matches
        }))
      );
      
      // Fetch matches for user's requests
      const requestMatchPromises = activeRequests.map(req =>
        findMatchingPropertiesForRequest({ requestId: req.id }).then(result => ({
          ...req,
          matches: result.matches.filter(m => m.matchScore >= 0.5), // Filter for significant matches
        }))
      );

      const resolvedPropertyMatches = await Promise.all(propertyMatchPromises);
      const resolvedRequestMatches = await Promise.all(requestMatchPromises);

      setPropertyMatches(resolvedPropertyMatches.filter(p => p.matches.length > 0));
      setRequestMatches(resolvedRequestMatches.filter(r => r.matches.length > 0));
      
    } catch (err: any) {
      console.error("Error calling AI matching flows:", err);
      const errorMessage = err.message || "Ocurrió un error al buscar coincidencias con IA.";
      setError(errorMessage);
      toast({
        title: "Error en Búsqueda IA",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      const user = JSON.parse(userJson);
      setLoggedInUser(user);
      fetchAllMatches(user.id);
    } else {
      setIsLoading(false);
    }
  }, [fetchAllMatches]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Buscando coincidencias para tus publicaciones...</p>
      </div>
    );
  }

  if (!loggedInUser) {
    return (
        <Card className="text-center py-10">
            <CardHeader>
                <CardTitle>Acceso Requerido</CardTitle>
                <CardDescription>Debes iniciar sesión para ver tus coincidencias de IA.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild><Link href="/auth/signin">Iniciar Sesión</Link></Button>
            </CardContent>
        </Card>
    );
  }

  if (error) {
     return (
        <Card className="border-destructive bg-destructive/10 shadow-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error en la Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive/90">{error}</p>
          </CardContent>
        </Card>
      );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center flex items-center justify-center">
            <Sparkles className="h-8 w-8 mr-3 text-primary" />
            Panel de Coincidencias (IA)
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Aquí la IA muestra las mejores coincidencias para tus publicaciones activas.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="requests-for-my-properties" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests-for-my-properties">
                <FileSearch className="mr-2 h-4 w-4"/> Solicitudes para mis Propiedades
            </TabsTrigger>
            <TabsTrigger value="properties-for-my-requests">
                 <Building className="mr-2 h-4 w-4"/> Propiedades para mis Solicitudes
            </TabsTrigger>
        </TabsList>
        <TabsContent value="requests-for-my-properties" className="mt-6">
          <div className="space-y-6">
            {propertyMatches.length > 0 ? (
                propertyMatches.map(propWithMatch => (
                    <MatchGroupCard key={propWithMatch.id} title={propWithMatch.title} slug={propWithMatch.slug} type="property">
                        {propWithMatch.matches.map(match => (
                            <MatchItemCard key={match.requestId} match={match} type="request"/>
                        ))}
                    </MatchGroupCard>
                ))
            ) : (
                <p className="text-center text-muted-foreground py-10">No se encontraron solicitudes compatibles para tus propiedades activas.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="properties-for-my-requests" className="mt-6">
          <div className="space-y-6">
            {requestMatches.length > 0 ? (
                requestMatches.map(reqWithMatch => (
                    <MatchGroupCard key={reqWithMatch.id} title={reqWithMatch.title} slug={reqWithMatch.slug} type="request">
                        {reqWithMatch.matches.map(match => (
                             <MatchItemCard key={match.propertyId} match={match} type="property"/>
                        ))}
                    </MatchGroupCard>
                ))
            ) : (
                 <p className="text-center text-muted-foreground py-10">No se encontraron propiedades compatibles para tus solicitudes activas.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MatchGroupCard({ title, slug, type, children }: {title: string, slug: string, type: 'property' | 'request', children: React.ReactNode}) {
    const link = type === 'property' ? `/properties/${slug}` : `/requests/${slug}`;
    const Icon = type === 'property' ? Building : FileSearch;
    return (
        <Card className="bg-secondary/40">
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary"/>
                    <span>Coincidencias para tu {type === 'property' ? 'Propiedad' : 'Solicitud'}: <Link href={link} className="text-primary hover:underline" target="_blank">{title}</Link></span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    )
}

function MatchItemCard({ match, type }: {match: RequestMatchResult | PropertyMatchResult, type: 'property' | 'request'}) {
    const title = type === 'property' ? (match as PropertyMatchResult).propertyTitle : (match as RequestMatchResult).requestTitle;
    const slug = type === 'property' ? (match as PropertyMatchResult).propertySlug : (match as RequestMatchResult).requestSlug;
    const link = type === 'property' ? `/properties/${slug}` : `/requests/${slug}`;
    
    return (
         <Card key={match.matchScore + title} className="bg-card p-4 rounded-lg shadow-sm">
          <CardTitle className="text-lg mb-2">
            <Link href={link} className="hover:text-primary hover:underline" target="_blank">
              {title}
            </Link>
          </CardTitle>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-medium">Puntuación de Coincidencia:</h3>
            <span className="text-lg font-bold text-accent">
              {(match.matchScore * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={match.matchScore * 100} className="w-full h-2 [&>div]:bg-accent" />
          <div className="mt-3">
            <h3 className="text-sm font-medium flex items-center mb-1">
              <MessageSquareText className="h-4 w-4 mr-2 text-muted-foreground" />
              Justificación de la IA:
            </h3>
            <p className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded-md whitespace-pre-line">
              {match.reason}
            </p>
          </div>
        </Card>
    );
}

export default function AiMatchingPage() {
  return (
    <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mt-20" />}>
      <AiMatchingPageContent />
    </Suspense>
  );
}
