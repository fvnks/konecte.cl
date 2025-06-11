
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SheetRow {
  [key: string]: string;
}

interface PaginatedSheetTableProps {
  headers: string[];
  rows: SheetRow[];
}

const DATA_ROWS_PER_PAGE = 6; // 6 filas de datos + 1 fila de cabecera = 7 filas por página

export default function PaginatedSheetTable({ headers, rows }: PaginatedSheetTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / DATA_ROWS_PER_PAGE));

  const startIndex = (currentPage - 1) * DATA_ROWS_PER_PAGE;
  const endIndex = startIndex + DATA_ROWS_PER_PAGE;
  const currentDataRows = rows.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1)); // Corregido: prev + 1
  };

  if (!headers || headers.length === 0) {
    return <p className="text-muted-foreground">No hay encabezados para mostrar.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentDataRows.length > 0 ? (
            currentDataRows.map((row, rowIndex) => (
              <TableRow key={`data-${rowIndex}`}>
                {headers.map((header) => (
                  <TableCell key={`data-${rowIndex}-${header}`}>{row[header] || ''}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length} className="text-center text-muted-foreground">
                No hay datos disponibles para esta página.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {rows.length > DATA_ROWS_PER_PAGE && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
