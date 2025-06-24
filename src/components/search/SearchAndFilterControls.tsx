'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search as SearchIcon } from 'lucide-react';

interface SearchAndFilterControlsProps {
  searchTarget: 'properties' | 'requests';
  initialSearchTerm?: string;
  showPropertyTypeFilter?: boolean;
  showCategoryFilter?: boolean;
  showSortBy?: boolean;
}

export default function SearchAndFilterControls({
  searchTarget,
  initialSearchTerm = '',
  showPropertyTypeFilter,
  showCategoryFilter,
  showSortBy,
}: SearchAndFilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      params.set('searchTerm', searchTerm.trim());
    } else {
      params.delete('searchTerm');
    }
    router.push(`/${searchTarget}?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={`Buscar en ${searchTarget}...`}
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <Button onClick={handleSearch} className="flex items-center gap-2">
            <SearchIcon className="h-4 w-4" /> Buscar
        </Button>
        {showSortBy && (
          <Select defaultValue="relevance">
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevancia</SelectItem>
              <SelectItem value="latest">Más Recientes</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
} 