'use client';

import { useState, useEffect } from 'react';
import { 
  getBugReportsAction, 
  markBugReportAsReadAction, 
  updateBugReportStatusAction,
  deleteBugReportAction,
  type BugReport
} from '@/actions/bugReportActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, Check, CheckCircle, Clock, Eye, Loader2, MoreHorizontal, 
  RefreshCcw, Trash2, XCircle 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';

const statusColors: Record<BugReport['status'], string> = {
  'new': 'bg-blue-100 text-blue-800 border-blue-200',
  'in_review': 'bg-purple-100 text-purple-800 border-purple-200',
  'in_progress': 'bg-amber-100 text-amber-800 border-amber-200',
  'fixed': 'bg-green-100 text-green-800 border-green-200',
  'wont_fix': 'bg-slate-100 text-slate-800 border-slate-200',
  'duplicate': 'bg-orange-100 text-orange-800 border-orange-200',
  'cannot_reproduce': 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<BugReport['status'], string> = {
  'new': 'Nuevo',
  'in_review': 'En revisión',
  'in_progress': 'En progreso',
  'fixed': 'Solucionado',
  'wont_fix': 'No se arreglará',
  'duplicate': 'Duplicado',
  'cannot_reproduce': 'No reproducible',
};

const statusOptions = [
  { value: 'new', label: 'Nuevo' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'fixed', label: 'Solucionado' },
  { value: 'wont_fix', label: 'No se arreglará' },
  { value: 'duplicate', label: 'Duplicado' },
  { value: 'cannot_reproduce', label: 'No reproducible' },
];

export default function BugReportsList() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<BugReport['status']>('new');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBugReports = async (page = currentPage, tab = currentTab) => {
    setIsLoading(true);
    try {
      const options: { page: number; pageSize: number; status?: string; isRead?: boolean } = {
        page,
        pageSize: 10
      };
      
      if (tab === 'unread') {
        options.isRead = false;
      } else if (tab !== 'all') {
        options.status = tab;
      }
      
      const result = await getBugReportsAction(options);
      setBugReports(result.bugReports);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error al obtener reportes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes de errores',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBugReports(currentPage, currentTab);
  }, [currentPage, currentTab]);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleMarkAsRead = async (report: BugReport) => {
    if (report.is_read) return;
    
    try {
      const result = await markBugReportAsReadAction(report.id);
      if (result.success) {
        setBugReports(prev => 
          prev.map(r => r.id === report.id ? { ...r, is_read: true } : r)
        );
      }
    } catch (error) {
      console.error('Error al marcar como leído:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedReport) return;
    
    setIsUpdating(true);
    try {
      const result = await updateBugReportStatusAction(
        selectedReport.id,
        newStatus,
        adminNotes || undefined
      );
      
      if (result.success) {
        toast({
          title: 'Estado actualizado',
          description: result.message,
        });
        
        setBugReports(prev => 
          prev.map(r => r.id === selectedReport.id 
            ? { ...r, status: newStatus, admin_notes: adminNotes || r.admin_notes } 
            : r
          )
        );
        
        setIsStatusDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del reporte',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteBugReportAction(selectedReport.id);
      
      if (result.success) {
        toast({
          title: 'Reporte eliminado',
          description: result.message,
        });
        
        setBugReports(prev => prev.filter(r => r.id !== selectedReport.id));
        setTotalCount(prev => prev - 1);
        setIsDeleteDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el reporte',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openStatusDialog = (report: BugReport) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setAdminNotes(report.admin_notes || '');
    setIsStatusDialogOpen(true);
  };

  const openDeleteDialog = (report: BugReport) => {
    setSelectedReport(report);
    setIsDeleteDialogOpen(true);
  };

  const renderBugReportCard = (report: BugReport) => {
    const formattedDate = formatDistanceToNow(new Date(report.created_at), {
      addSuffix: true,
      locale: es
    });
    
    return (
      <Card 
        key={report.id} 
        className={`border ${report.is_read ? '' : 'border-l-4 border-l-blue-500'}`}
        onClick={() => handleMarkAsRead(report)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {report.description.split('\n')[0]}
              </CardTitle>
              <CardDescription>
                {report.name ? `Reportado por ${report.name}` : 'Reporte anónimo'} • {formattedDate}
              </CardDescription>
            </div>
            <Badge className={`${statusColors[report.status]} border`}>
              {statusLabels[report.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-2">
            <p className="text-sm whitespace-pre-line line-clamp-3">{report.description}</p>
            
            {report.steps_to_reproduce && (
              <div className="text-sm text-muted-foreground">
                <strong>Pasos para reproducir:</strong>
                <p className="whitespace-pre-line line-clamp-2">{report.steps_to_reproduce}</p>
              </div>
            )}
            
            {report.page_url && (
              <div className="text-xs text-muted-foreground truncate">
                <strong>URL:</strong> {report.page_url}
              </div>
            )}
            
            {report.admin_notes && (
              <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Notas del administrador:</strong>
                <p className="whitespace-pre-line line-clamp-2">{report.admin_notes}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            {!report.is_read && (
              <Badge variant="outline" className="mr-2 text-blue-500 border-blue-200">
                <AlertCircle className="h-3 w-3 mr-1" /> No leído
              </Badge>
            )}
            {report.email && (
              <span className="truncate max-w-[200px]">{report.email}</span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!report.is_read && (
                <DropdownMenuItem onClick={() => handleMarkAsRead(report)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Marcar como leído
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => openStatusDialog(report)}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Cambiar estado
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => openDeleteDialog(report)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar reporte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    );
  };

  return (
    <>
      <Tabs defaultValue="all" value={currentTab} onValueChange={handleTabChange}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="unread">No leídos</TabsTrigger>
            <TabsTrigger value="new">Nuevos</TabsTrigger>
            <TabsTrigger value="in_progress">En progreso</TabsTrigger>
            <TabsTrigger value="fixed">Solucionados</TabsTrigger>
          </TabsList>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchBugReports(currentPage, currentTab)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" />
            )}
            Actualizar
          </Button>
        </div>

        <TabsContent value="all" className="mt-4">
          {renderReportsList()}
        </TabsContent>
        
        <TabsContent value="unread" className="mt-4">
          {renderReportsList()}
        </TabsContent>
        
        <TabsContent value="new" className="mt-4">
          {renderReportsList()}
        </TabsContent>
        
        <TabsContent value="in_progress" className="mt-4">
          {renderReportsList()}
        </TabsContent>
        
        <TabsContent value="fixed" className="mt-4">
          {renderReportsList()}
        </TabsContent>
      </Tabs>

      {/* Diálogo para cambiar estado */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar estado del reporte</DialogTitle>
            <DialogDescription>
              Cambia el estado del reporte y añade notas si es necesario.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as BugReport['status'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas del administrador</label>
              <Textarea 
                placeholder="Añade notas sobre este reporte (opcional)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStatusUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Guardar cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmar eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  function renderReportsList() {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-[250px]" />
                    <Skeleton className="h-4 w-[180px]" />
                  </div>
                  <Skeleton className="h-6 w-[100px]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    if (bugReports.length === 0) {
      return (
        <div className="text-center py-10">
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No hay reportes</h3>
          <p className="text-muted-foreground">
            {currentTab === 'unread' 
              ? 'No hay reportes sin leer en este momento.' 
              : currentTab === 'all' 
                ? 'No se encontraron reportes de errores.' 
                : `No hay reportes con estado "${statusLabels[currentTab as BugReport['status']]}" en este momento.`}
          </p>
        </div>
      );
    }
    
    return (
      <>
        <div className="space-y-4">
          {bugReports.map(report => renderBugReportCard(report))}
        </div>
        
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </>
    );
  }
} 