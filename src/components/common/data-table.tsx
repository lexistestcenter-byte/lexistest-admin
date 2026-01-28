"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  totalItems?: number;
  pageSize?: number;
  currentPage?: number;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  searchPlaceholder = "검색...",
  totalItems = data.length,
  pageSize = 10,
  currentPage = 1,
  onSearch,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState("");
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (size: string) => {
    if (onPageSizeChange) {
      onPageSizeChange(parseInt(size));
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-8"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">페이지당</span>
          <Select
            defaultValue={pageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-[70px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            · 전체 {totalItems.toLocaleString()}개
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{currentPage}</span> / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
