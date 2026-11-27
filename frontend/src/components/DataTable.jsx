import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner.jsx';
import { EmptyState } from './EmptyState.jsx';

export function DataTable({
  columns,
  rows,
  isLoading = false,
  searchValue = '',
  onSearchChange = null,
  searchPlaceholder = 'Search records...',
  filterSlot = null,
  page = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange = null,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filter criteria.',
  emptyIcon = null,
}) {
  return (
    <div className="card-surface overflow-hidden">
      {(onSearchChange || filterSlot) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="input-field py-2 pl-9"
              />
            </div>
          )}
          {filterSlot && <div className="flex flex-wrap items-center gap-2">{filterSlot}</div>}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner label="Loading records..." />
      ) : rows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-4 py-3.5">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, idx) => (
                <tr key={row._id || row.id || idx} className="hover:bg-slate-50/80">
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3.5 text-slate-700">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
          <span>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn-secondary px-2.5 py-1.5 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn-secondary px-2.5 py-1.5 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
