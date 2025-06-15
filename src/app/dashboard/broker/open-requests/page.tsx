// src/app/dashboard/broker/open-requests/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Handshake, AlertTriangle, PackageOpen, UserCircle, Building } from 'lucide-react';
import type { SearchRequest, User as StoredUserType, PropertyListing } from '@/lib/types';
import { getRequestsAction } from '@/actions/requestActions';
import { getUserPropertiesAction } from '@/actions/propertyActions'; // To fetch broker's own properties
import { useToast } from '@/hooks/use-toast';
import RequestListItem from '@/components/request/RequestListItem';
import ProposePropertyDialog from '@/components/broker/ProposePropertyDialog'; // New Dialog

export default function OpenCollaborationRequestsPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [openRequests, setOpenRequests] = useState<SearchRequest[]>([]);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUserProperties, setIsLoadingUserProperties] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [selectedRequestForProposal, setSelectedRequestForProposal] = useState<SearchRequest | null>(null);
  const [isProposeDialogVali