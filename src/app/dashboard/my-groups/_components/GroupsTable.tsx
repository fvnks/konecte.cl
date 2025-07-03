'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Building, MoreHorizontal, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import SetPrimaryButton from './SetPrimaryButton';
import DeleteGroupButton from './DeleteGroupButton';
import GroupFilters from './GroupFilters';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Owner {
  name?: string;
  avatarUrl?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  isOwner: boolean;
  owner?: Owner;
}

interface GroupsTableProps {
  groups: Group[];
  primaryGroupId?: string;
}

export default function GroupsTable({ groups, primaryGroupId }: GroupsTableProps) {
  const [filteredGroups, setFilteredGroups] = useState(groups);

  return (
    <Card>
      <CardHeader className="pb-3">
        <GroupFilters groups={groups} onFilteredGroupsChange={setFilteredGroups} />
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[300px]">Grupo</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead className="text-center">Miembros</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <TableRow key={group.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border bg-background">
                          <AvatarImage src={group.avatarUrl} alt={group.name} />
                          <AvatarFallback className="bg-primary/10">
                            <Building className="h-5 w-5 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {group.name}
                            {group.isOwner && (
                              <Badge variant="outline" className="text-xs font-normal">
                                Propietario
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {group.description || 'Sin descripción.'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border">
                          <AvatarImage src={group.owner?.avatarUrl} alt={group.owner?.name} />
                          <AvatarFallback className="text-xs">{group.owner?.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{group.owner?.name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {group.memberCount}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {group.id === primaryGroupId ? (
                        <Badge className="bg-primary text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Principal
                        </Badge>
                      ) : (
                        <SetPrimaryButton groupId={group.id} isPrimary={false} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button asChild variant="outline" size="sm" className="mr-2">
                          <Link href={`/dashboard/my-groups/${group.id}`}>
                            Administrar
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/my-groups/${group.id}`} className="w-full cursor-pointer">
                                Administrar
                              </Link>
                            </DropdownMenuItem>
                            <DeleteGroupButton 
                              groupId={group.id} 
                              groupName={group.name} 
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No se encontraron grupos que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 