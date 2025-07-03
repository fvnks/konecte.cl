'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Group {
  id: string;
  name: string;
  description?: string;
  isOwner: boolean;
  // otros campos que pueda tener un grupo
}

interface GroupFiltersProps {
  groups: Group[];
  onFilteredGroupsChange: (filteredGroups: Group[]) => void;
}

export default function GroupFilters({ groups, onFilteredGroupsChange }: GroupFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const filteredGroups = groups.filter(group => {
      // Filtro por texto de búsqueda
      const matchesSearch = 
        searchTerm === '' || 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro por tab seleccionado
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'owned' && group.isOwner) || 
        (activeTab === 'member' && !group.isOwner);
      
      return matchesSearch && matchesTab;
    });

    onFilteredGroupsChange(filteredGroups);
  }, [searchTerm, activeTab, groups, onFilteredGroupsChange]);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="relative w-full md:w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar grupos..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="owned">Mis grupos</TabsTrigger>
          <TabsTrigger value="member">Membresías</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
} 