// components/invoice/InvoiceTrackingTable.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InvoiceRecord {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string; 
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
  paymentDate: string;
  poNumber: string;
  paymentTerms: string;
  emailSent: string;
  remindersSent: number;
  lastModified: string;
  notes: string;
}

interface InvoiceTrackingTableProps {
  sheetId: string;
  onSendReminder: (invoiceNumber: string) => void;
  onMarkAsPaid: (invoiceNumbers: string[]) => void;
  refreshTrigger?: number; // Increment this to force refresh
}

type FilterType = 'All' | 'Unpaid' | 'Paid' | 'Overdue';

const InvoiceTrackingTable = ({ 
  sheetId, 
  onSendReminder, 
  onMarkAsPaid,
  refreshTrigger 
}: InvoiceTrackingTableProps) => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(true);   // open by default
  const [jumpInput, setJumpInput] = useState('');

  const ITEMS_PER_PAGE = 10;

  const fetchInvoices = useCallback(async () => {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('No invoice data found in spreadsheet');
      }
      
      const parsedInvoices: InvoiceRecord[] = [];
      
      // Parse CSV (skip header row)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Better CSV parsing to handle commas in content
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        // Skip if no invoice number
        if (!values[0] || values[0].trim() === '') {
          continue;
        }
        
        if (values.length >= 13) {
          const invoice: InvoiceRecord = {
            invoiceNumber: values[0],
            customerName: values[1],
            customerEmail: values[2],
            invoiceDate: values[3],
            dueDate: values[4],
            totalAmount: parseFloat(values[5]) || 0,
            paymentStatus: (values[6] as any) || 'Unpaid',
            paymentDate: values[7] || '',
            poNumber: values[8] || '',
            paymentTerms: values[9] || '',
            emailSent: values[10] || '',
            remindersSent: parseInt(values[11]) || 0,
            lastModified: values[12] || '',
            notes: values[13] || ''
          };
          
          parsedInvoices.push(invoice);
        }
      }
      
      // Sort by newest first (assuming invoice numbers are chronological or use invoice date)
      parsedInvoices.sort((a, b) => {
        const dateA = new Date(parseAuDate(a.invoiceDate));
        const dateB = new Date(parseAuDate(b.invoiceDate));
        return dateB.getTime() - dateA.getTime();
      });
      
      setInvoices(parsedInvoices);
      setLoading(false);
      setError(null);
      
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(`Unable to load invoices. ${err.message}`);
      setLoading(false);
    }
  }, [sheetId]);

  // Fetch on mount and when sheetId or refreshTrigger changes
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, refreshTrigger]);

  // Calculate days overdue
  const calculateDaysOverdue = (dueDate: string): number => {
    const due = new Date(parseAuDate(dueDate));
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Filter and search logic
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Apply status filter
    if (filter === 'Paid') {
      result = result.filter(inv => inv.paymentStatus === 'Paid');
    } else if (filter === 'Unpaid') {
      result = result.filter(inv => inv.paymentStatus === 'Unpaid');
    } else if (filter === 'Overdue') {
      result = result.filter(inv => 
        inv.paymentStatus === 'Unpaid' && calculateDaysOverdue(inv.dueDate) > 0
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.customerName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [invoices, filter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  // Count by status
  const counts = useMemo(() => {
    const all = invoices.length;
    const paid = invoices.filter(inv => inv.paymentStatus === 'Paid').length;
    const unpaid = invoices.filter(inv => inv.paymentStatus === 'Unpaid').length;
    const overdue = invoices.filter(inv => 
      inv.paymentStatus === 'Unpaid' && calculateDaysOverdue(inv.dueDate) > 0
    ).length;
    
    return { all, paid, unpaid, overdue };
  }, [invoices]);

  // Selection handlers
  const toggleSelect = (invoiceNumber: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceNumber)) {
      newSelected.delete(invoiceNumber);
    } else {
      newSelected.add(invoiceNumber);
    }
    setSelectedInvoices(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.size === paginatedInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      const allOnPage = new Set(paginatedInvoices.map(inv => inv.invoiceNumber));
      setSelectedInvoices(allOnPage);
    }
  };

  const handleBulkMarkAsPaid = () => {
    if (selectedInvoices.size === 0) return;
    onMarkAsPaid(Array.from(selectedInvoices));
    setSelectedInvoices(new Set());
  };

  // Keyboard shortcut: Ctrl+F to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('invoice-search')?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <button
          onClick={() => setIsOpen(o => !o)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-left hover:from-blue-700 hover:to-blue-800 transition-colors"
        >
          <div>
            <h2 className="text-2xl font-bold text-white">📊 Invoice Tracking & Management</h2>
            <p className="text-blue-100 text-sm mt-1">Loading invoices...</p>
          </div>
          <svg className={`w-6 h-6 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading invoices...</span>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <button
          onClick={() => setIsOpen(o => !o)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-left hover:from-blue-700 hover:to-blue-800 transition-colors"
        >
          <div>
            <h2 className="text-2xl font-bold text-white">📊 Invoice Tracking & Management</h2>
            <p className="text-blue-100 text-sm mt-1">Error loading invoices</p>
          </div>
          <svg className={`w-6 h-6 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="bg-red-50 border border-red-200 m-4 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-red-800 font-semibold">Error Loading Invoices</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={fetchInvoices}
                  className="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* ── Collapsible Header ── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-left hover:from-blue-700 hover:to-blue-800 transition-colors"
        aria-expanded={isOpen}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">📊 Invoice Tracking & Management</h2>
          <p className="text-blue-100 text-sm mt-1">
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <svg
          className={`w-6 h-6 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>

      {/* Filters & Search */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <FilterButton
              label={`All (${counts.all})`}
              active={filter === 'All'}
              onClick={() => setFilter('All')}
            />
            <FilterButton
              label={`Unpaid (${counts.unpaid})`}
              active={filter === 'Unpaid'}
              onClick={() => setFilter('Unpaid')}
              color="orange"
            />
            <FilterButton
              label={`Paid (${counts.paid})`}
              active={filter === 'Paid'}
              onClick={() => setFilter('Paid')}
              color="green"
            />
            <FilterButton
              label={`Overdue (${counts.overdue})`}
              active={filter === 'Overdue'}
              onClick={() => setFilter('Overdue')}
              color="red"
            />
            {(filter !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setFilter('All');
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <input
              id="invoice-search"
              type="text"
              placeholder="Search invoice # or customer... (Ctrl+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
            <svg 
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedInvoices.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3"
          >
            <span className="text-blue-800 font-semibold">
              {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkMarkAsPaid}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm font-semibold"
            >
              ✓ Mark as Paid
            </button>
            <button
              onClick={() => setSelectedInvoices(new Set())}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Clear Selection
            </button>
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedInvoices.size === paginatedInvoices.length && paginatedInvoices.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Invoice #</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th> 
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Invoice Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {paginatedInvoices.map((invoice) => {
                const daysOverdue = calculateDaysOverdue(invoice.dueDate);
                const isOverdue = daysOverdue > 0 && invoice.paymentStatus === 'Unpaid';
                const isSelected = selectedInvoices.has(invoice.invoiceNumber);

                return (
                  <motion.tr
                    key={invoice.invoiceNumber}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(invoice.invoiceNumber)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {invoice.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                    {invoice.customerEmail}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.invoiceDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.dueDate}
                      {isOverdue && (
                        <div className="mt-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                            daysOverdue > 7 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {daysOverdue > 7 ? '⚠️' : '⚡'} {daysOverdue} days overdue
                          </span>
                        </div>
                      )}
                      {!isOverdue && invoice.paymentStatus === 'Unpaid' && (
                        <div className="mt-1">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                            Not yet due
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      ${invoice.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={invoice.paymentStatus} paymentDate={invoice.paymentDate} />
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm">No invoices found matching your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-3">

          {/* Left: summary */}
          <span className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-gray-800">{totalPages}</span>
            {' '}·{' '}{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
          </span>

          {/* Centre: prev / page numbers / next */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              return start + i;
            }).map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                  p === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>

          {/* Right: jump to page */}
          <form
            onSubmit={e => {
              e.preventDefault();
              const n = parseInt(jumpInput);
              if (!isNaN(n) && n >= 1 && n <= totalPages) {
                setCurrentPage(n);
                setJumpInput('');
              }
            }}
            className="flex items-center gap-1.5"
          >
            <label className="text-xs text-gray-500 whitespace-nowrap">Go to page</label>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={e => setJumpInput(e.target.value)}
              placeholder={String(totalPages)}
              className="w-16 px-2 py-1.5 text-xs text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Go
            </button>
          </form>
        </div>
      )}
        </>
      )}
    </div>
  );
};

// Helper Components
const FilterButton = ({ 
  label, 
  active, 
  onClick, 
  color = 'blue' 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void; 
  color?: string;
}) => {
  const colorClasses = {
    blue: active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100',
    orange: active ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100',
    green: active ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100',
    red: active ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border border-gray-300 font-semibold text-sm transition ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      {label}
    </button>
  );
};

const StatusBadge = ({ status, paymentDate }: { status: string; paymentDate: string }) => {
  const styles = {
    Paid: 'bg-green-100 text-green-800 border-green-300',
    Unpaid: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  };

  return (
    <div className="inline-flex flex-col items-center">
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {status === 'Paid' ? '✓ ' : ''}{status}
      </span>
      {paymentDate && status === 'Paid' && (
        <span className="text-xs text-gray-500 mt-1">{paymentDate}</span>
      )}
    </div>
  );
};

// Helper to parse AU date format (DD/MM/YYYY) to ISO
function parseAuDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr; // Fallback to original if not in expected format
}

export default InvoiceTrackingTable;