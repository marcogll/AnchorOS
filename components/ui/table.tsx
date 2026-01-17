import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

/**
 * Table component for displaying tabular data with sticky header.
 */
const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        style={{
          borderCollapse: 'separate',
          borderSpacing: 0
        }}
        {...props}
      />
    </div>
  )
)
Table.displayName = "Table"

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

/**
 * TableHeader component for table header with sticky positioning.
 */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b", className)}
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      backgroundColor: 'var(--ivory-cream)'
    }}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

/**
 * TableBody component for table body with hover effects.
 */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  TableBodyProps
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

/**
 * TableFooter component for table footer.
 */
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  TableFooterProps
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    style={{
      backgroundColor: 'var(--sand-beige)'
    }}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

/**
 * TableRow component for table row with hover effect.
 */
const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      style={{
        borderColor: 'var(--mocha-taupe)',
        backgroundColor: 'var(--ivory-cream)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--soft-cream)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--ivory-cream)'
      }}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

/**
 * TableHead component for table header cell with bold text.
 */
const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      style={{
        color: 'var(--charcoal-brown)',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '11px',
        letterSpacing: '0.05em'
      }}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

/**
 * TableCell component for table data cell.
 */
const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      style={{
        color: 'var(--charcoal-brown)'
      }}
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"

interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

/**
 * TableCaption component for table caption.
 */
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  TableCaptionProps
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    style={{
      color: 'var(--charcoal-brown)',
      opacity: 0.7
    }}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

interface SortableTableHeadProps extends TableHeadProps {
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
}

/**
 * SortableTableHead component for sortable table headers with sort indicators.
 * @param {boolean} sortable - Whether the column is sortable
 * @param {string} sortDirection - Current sort direction: asc, desc, or null
 * @param {Function} onSort - Callback when sort is clicked
 */
export function SortableTableHead({
  sortable = false,
  sortDirection = null,
  onSort,
  className,
  children,
  ...props
}: SortableTableHeadProps) {
  return (
    <TableHead
      className={cn(
        sortable && "cursor-pointer hover:bg-muted/50 select-none",
        className
      )}
      onClick={sortable ? onSort : undefined}
      style={{
        userSelect: sortable ? 'none' : 'auto'
      }}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <span className="flex items-center gap-0.5" style={{ opacity: sortDirection ? 1 : 0.3 }}>
            <ArrowUp className="h-3 w-3" style={{ color: sortDirection === 'asc' ? 'var(--deep-earth)' : 'var(--mocha-taupe)' }} />
            <ArrowDown className="h-3 w-3 -mt-2" style={{ color: sortDirection === 'desc' ? 'var(--deep-earth)' : 'var(--mocha-taupe)' }} />
          </span>
        )}
      </div>
    </TableHead>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  totalItems?: number
  showPageSizeSelector?: boolean
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

/**
 * Pagination component for table pagination.
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {Function} onPageChange - Callback when page changes
 * @param {number} pageSize - Number of items per page
 * @param {number} totalItems - Total number of items
 * @param {boolean} showPageSizeSelector - Whether to show page size selector
 * @param {number[]} pageSizeOptions - Available page size options
 * @param {Function} onPageSizeChange - Callback when page size changes
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  showPageSizeSelector = false,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
}: PaginationProps) {
  const startItem = ((currentPage - 1) * (pageSize || 10)) + 1
  const endItem = Math.min(currentPage * (pageSize || 10), totalItems || 0)

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--charcoal-brown)' }}>
        {totalItems !== undefined && pageSize !== undefined && (
          <span>
            Mostrando {startItem}-{endItem} de {totalItems}
          </span>
        )}
        {showPageSizeSelector && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded border px-2 py-1 text-sm"
            style={{
              backgroundColor: 'var(--ivory-cream)',
              borderColor: 'var(--mocha-taupe)',
              color: 'var(--charcoal-brown)'
            }}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size} por página</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: currentPage === 1 ? 'transparent' : 'var(--ivory-cream)'
          }}
        >
          <ChevronsLeft className="h-4 w-4" style={{ color: 'var(--charcoal-brown)' }} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: currentPage === 1 ? 'transparent' : 'var(--ivory-cream)'
          }}
        >
          <ChevronLeft className="h-4 w-4" style={{ color: 'var(--charcoal-brown)' }} />
        </button>

        <span className="px-3 py-1 text-sm" style={{ color: 'var(--charcoal-brown)' }}>
          Página {currentPage} de {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: currentPage === totalPages ? 'transparent' : 'var(--ivory-cream)'
          }}
        >
          <ChevronRight className="h-4 w-4" style={{ color: 'var(--charcoal-brown)' }} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: currentPage === totalPages ? 'transparent' : 'var(--ivory-cream)'
          }}
        >
          <ChevronsRight className="h-4 w-4" style={{ color: 'var(--charcoal-brown)' }} />
        </button>
      </div>
    </div>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
