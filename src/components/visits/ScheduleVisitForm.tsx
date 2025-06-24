'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useToast } from '@/hooks/use-toast';
import { adminScheduleVisitFormSchema } from '@/lib/types';
import { searchUsersAction } from '@/actions/userActions';
import { searchPropertiesAction, searchMyPropertiesAction } from '@/actions/propertyActions';
import { scheduleVisitByAdminAction } from '@/actions/visitActions';

type ScheduleVisitFormValues = z.infer<typeof adminScheduleVisitFormSchema>;

interface SearchResult {
  id: string;
  name: string;
}

interface PropertySearchResult {
  id: string;
  title: string;
  address: string;
}

interface ScheduleVisitFormProps {
  loggedInUserId: string;
  userRole: 'admin' | 'user';
}

export default function ScheduleVisitForm({ loggedInUserId, userRole }: ScheduleVisitFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<SearchResult[]>([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);

  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const [propertySearchResults, setPropertySearchResults] = useState<PropertySearchResult[]>([]);
  const [isSearchingProperty, setIsSearchingProperty] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertySearchResult | null>(null);

  const form = useForm<ScheduleVisitFormValues>({
    resolver: zodResolver(adminScheduleVisitFormSchema),
    defaultValues: {
      userId: '',
      propertyId: '',
      visitDate: new Date(),
      visitTime: '10:00',
    },
  });

  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    setSelectedUser(null);
    form.setValue('userId', '');

    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setIsSearchingUser(true);
    const users = await searchUsersAction(query);
    // Filtrar para que el usuario no pueda agendarse a sí mismo
    const formattedUsers = users
      .filter(u => u.id !== loggedInUserId)
      .map(u => ({ id: u.id, name: `${u.name} (${u.email})` }));
    setUserSearchResults(formattedUsers);
    setIsSearchingUser(false);
  };

  const handlePropertySearch = async (query: string) => {
    setPropertySearchQuery(query);
    setSelectedProperty(null);
    form.setValue('propertyId', '');

    if (query.length < 2) {
      setPropertySearchResults([]);
      return;
    }
    setIsSearchingProperty(true);
    const properties = userRole === 'admin'
      ? await searchPropertiesAction(query)
      : await searchMyPropertiesAction(loggedInUserId, query);
    setPropertySearchResults(properties);
    setIsSearchingProperty(false);
  };
  
  const selectUser = (user: SearchResult) => {
    setSelectedUser(user);
    setUserSearchQuery(user.name);
    form.setValue('userId', user.id);
    setUserSearchResults([]);
  };

  const selectProperty = (property: PropertySearchResult) => {
    setSelectedProperty(property);
    setPropertySearchQuery(`${property.title} - ${property.address}`);
    form.setValue('propertyId', property.id);
    setPropertySearchResults([]);
  };

  const onSubmit = (values: ScheduleVisitFormValues) => {
    startTransition(async () => {
      // Por ahora, solo la acción de admin está implementada para crear la visita.
      // A futuro, se podría tener una scheduleVisitByUserAction si los permisos son distintos.
      const result = await scheduleVisitByAdminAction(values);
      if (result.success) {
        toast({
          title: 'Visita Agendada',
          description: `Se ha agendado la visita para ${selectedUser?.name}.`,
        });
        const redirectUrl = userRole === 'admin' ? '/admin/visits' : '/dashboard/visits';
        router.push(redirectUrl);
      } else {
        toast({
          title: 'Error al Agendar',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendar Nueva Visita</CardTitle>
        <CardDescription>
          {userRole === 'admin'
            ? 'Busca cualquier usuario y propiedad para crear una nueva visita.'
            : 'Busca un usuario y una de tus propiedades para agendar una visita.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* User Search */}
            <FormField
              control={form.control}
              name="userId"
              render={() => (
                <FormItem>
                  <FormLabel>Buscar Usuario a Invitar</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Escribe nombre o email del usuario..."
                        value={userSearchQuery}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        className="pl-10"
                      />
                      {isSearchingUser && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                  {userSearchResults.length > 0 && (
                    <div className="relative">
                      <ul className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                        {userSearchResults.map((user) => (
                          <li
                            key={user.id}
                            className="px-4 py-2 hover:bg-muted cursor-pointer"
                            onClick={() => selectUser(user)}
                          >
                            {user.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </FormItem>
              )}
            />
            
            {/* Property Search */}
            <FormField
              control={form.control}
              name="propertyId"
              render={() => (
                <FormItem>
                  <FormLabel>
                    {userRole === 'admin' ? 'Buscar Propiedad' : 'Buscar en Mis Propiedades'}
                  </FormLabel>
                   <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Escribe título o dirección..."
                        value={propertySearchQuery}
                        onChange={(e) => handlePropertySearch(e.target.value)}
                        className="pl-10"
                      />
                      {isSearchingProperty && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                  {propertySearchResults.length > 0 && (
                    <div className="relative">
                      <ul className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                        {propertySearchResults.map((prop) => (
                          <li
                            key={prop.id}
                            className="px-4 py-2 hover:bg-muted cursor-pointer"
                            onClick={() => selectProperty(prop)}
                          >
                            {prop.title} <span className="text-sm text-muted-foreground">({prop.address})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </FormItem>
              )}
            />

             {/* Date and Time pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de la Visita</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visitTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de la Visita (24h)</FormLabel>
                    <FormControl>
                      <div className="relative">
                         <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input type="time" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agendar Visita
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 