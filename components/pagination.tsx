"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  const textColorClasses = "text-green-700 dark:text-green-400";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 text-sm">
      <div className="flex items-center gap-2">
        <p className={`font-medium ${textColorClasses}`}>Rows per page:</p>
        <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className={`h-8 w-[70px] ${textColorClasses} border-gray-300 dark:border-gray-600 dark:bg-transparent focus:ring-green-500`}>
            <SelectValue placeholder={pageSize.toString()} />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800">
            <SelectItem value="5" className="dark:focus:bg-gray-700">5</SelectItem>
            <SelectItem value="10" className="dark:focus:bg-gray-700">10</SelectItem>
            <SelectItem value="15" className="dark:focus:bg-gray-700">15</SelectItem>
            <SelectItem value="20" className="dark:focus:bg-gray-700">20</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <div className={`font-medium ${textColorClasses}`}>
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className={`h-4 w-4 ${textColorClasses}`} />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className={`h-4 w-4 ${textColorClasses}`} />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className={`h-4 w-4 ${textColorClasses}`} />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className={`h-4 w-4 ${textColorClasses}`} />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
