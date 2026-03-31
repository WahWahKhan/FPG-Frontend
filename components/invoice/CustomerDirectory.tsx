// components/invoice/CustomerDirectory.tsx
// Collapsible customer directory panel for invoice-builder.tsx
// Email feature: multi-select contacts → mailto: with all selected emails
// No Graph API required.

import React, { useState, useEffect, useRef } from 'react';

interface CustomerRecord {
  name: string;
  company: string;
  phone: string;
  mobile: string;
  email: string;
  stateIndex: number;
  stateLabel: string;
  isRole: boolean;
}

interface ApiResponse {
  total: number;
  page: number;
  pages: number;
  limit: number;
  customers: CustomerRecord[];
}

const STATE_OPTIONS = [
  { label: 'All States',    value: '' },
  { label: 'VIC / TAS',    value: '0' },
  { label: 'NSW / ACT',    value: '1' },
  { label: 'QLD',          value: '2' },
  { label: 'WA / SA / NT', value: '3' },
  { label: 'Mobile only',  value: '4' },
];

const MAX_MAILTO   = 20;
const WARN_MAILTO  = 10;
const PER_PAGE     = 50;

function phoneHref(raw: string): string {
  return `tel:${raw.replace(/\s/g, '')}`;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function StateBadge({ label }: { label: string }) {
  const colours: Record<string, string> = {
    'VIC/TAS':  'bg-blue-100 text-blue-700',
    'NSW/ACT':  'bg-purple-100 text-purple-700',
    'QLD':      'bg-red-100 text-red-700',
    'WA/SA/NT': 'bg-amber-100 text-amber-700',
    'Mobile':   'bg-gray-100 text-gray-600',
    'Unknown':  'bg-gray-100 text-gray-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${colours[label] || colours['Unknown']}`}>
      {label}
    </span>
  );
}

export default function CustomerDirectory() {
  const [isOpen, setIsOpen]           = useState(false);
  const [query, setQuery]             = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [hasEmail, setHasEmail]       = useState(false);
  const [hasMobile, setHasMobile]     = useState(false);
  const [hideRoles, setHideRoles]     = useState(false);
  const [page, setPage]               = useState(1);
  const [jumpInput, setJumpInput]     = useState('');
  const [data, setData]               = useState<ApiResponse | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [selected, setSelected]       = useState<Set<string>>(new Set());

  const debouncedFetch = useRef(
    debounce((params: Record<string, string>) => {
      const url = new URL('/api/customers/list', window.location.origin);
      Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
      setLoading(true);
      setError('');
      fetch(url.toString())
        .then(r => r.json())
        .then((d: ApiResponse) => { setData(d); setLoading(false); })
        .catch(() => { setError('Failed to load customers'); setLoading(false); });
    }, 300)
  ).current;

  useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set());
    debouncedFetch({
      q:         query,
      state:     stateFilter,
      hasEmail:  hasEmail  ? '1' : '',
      hasMobile: hasMobile ? '1' : '',
      roleOnly:  hideRoles ? '0' : '',
      page:      String(page),
      limit:     String(PER_PAGE),
    });
  }, [isOpen, query, stateFilter, hasEmail, hasMobile, hideRoles, page, debouncedFetch]);

  useEffect(() => { setPage(1); }, [query, stateFilter, hasEmail, hasMobile, hideRoles]);

  const customers = data?.customers || [];

  const toggleSelect = (email: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected(prev => {
      const next = new Set(prev);
      customers.filter(c => c.email).forEach(c => next.add(c.email));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  // Build mailto: href — if contacts are selected, uses all of them; otherwise single email
  const mailtoHref = (fallbackEmail?: string): string => {
    const emails = selected.size > 0 ? Array.from(selected) : fallbackEmail ? [fallbackEmail] : [];
    return `mailto:${emails.join(',')}`;
  };

  const overLimit = selected.size > MAX_MAILTO;
  const overWarn  = selected.size > WARN_MAILTO && selected.size <= MAX_MAILTO;

  // Header checkbox state
  const emailCustomers = customers.filter(c => c.email);
  const allVisibleSelected = emailCustomers.length > 0 && emailCustomers.every(c => selected.has(c.email));

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">

      {/* ── Header — blue gradient matching InvoiceTrackingTable ── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-left hover:from-blue-700 hover:to-blue-800 transition-colors"
        aria-expanded={isOpen}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">👥 Customer Directory</h2>
          <p className="text-blue-100 text-sm mt-1">Search, filter and contact customers</p>
        </div>
        <svg
          className={`w-6 h-6 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div>
          {/* ── Filters ── */}
          <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search name or company..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {STATE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {([
                ['Has email',  hasEmail,  setHasEmail],
                ['Has mobile', hasMobile, setHasMobile],
                ['People only (hide Accounts/Admin roles)', hideRoles, setHideRoles],
              ] as [string, boolean, (v: boolean) => void][]).map(([label, value, setter]) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer text-gray-600">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={e => setter(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* ── Selection banner ── */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-800">
                  {selected.size} contact{selected.size !== 1 ? 's' : ''} selected
                </span>
                {overLimit && (
                  <span className="text-xs text-red-600 font-medium">
                    ⚠ Over {MAX_MAILTO} — deselect some before emailing
                  </span>
                )}
                {overWarn && (
                  <span className="text-xs text-amber-600 font-medium">
                    ⚠ Large selection — some mail apps may truncate
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearSelection}
                  className="text-xs px-3 py-1.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear
                </button>
                {!overLimit && (
                  <a
                    href={mailtoHref()}
                    className="text-xs px-3 py-1.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    ✉ Email {selected.size} selected
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── Results bar ── */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {loading
                ? <span className="text-sm text-gray-400">Loading...</span>
                : <span className="text-sm text-gray-500">{data ? `${data.total.toLocaleString()} results` : ''}</span>
              }
              {emailCustomers.length > 0 && (
                <button onClick={selectAllVisible} className="text-xs text-blue-600 hover:text-blue-700 underline">
                  Select visible with email
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">
              Tick contacts · click ✉ to open all in your mail app
            </p>
          </div>

          {error && <div className="p-6 text-center text-sm text-red-500">{error}</div>}

          {/* ── Table ── */}
          {!error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={e => e.target.checked ? selectAllVisible() : clearSelection()}
                        className="w-4 h-4 text-blue-600 rounded"
                        title="Select / deselect all visible"
                      />
                    </th>
                    <th className="px-3 py-3 text-left">Name</th>
                    <th className="px-3 py-3 text-left">Company</th>
                    <th className="px-3 py-3 text-left">Phone</th>
                    <th className="px-3 py-3 text-left">Mobile</th>
                    <th className="px-3 py-3 text-left w-44">Email</th>
                    <th className="px-3 py-3 text-left">State</th>
                    {/* Wider actions column for mobile tap targets */}
                    <th className="px-3 py-3 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c, i) => {
                    const isSelected = !!c.email && selected.has(c.email);
                    return (
                      <tr key={i} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>

                        {/* Checkbox */}
                        <td className="px-3 py-2.5 text-center">
                          {c.email
                            ? <input type="checkbox" checked={isSelected}
                                onChange={() => toggleSelect(c.email)}
                                className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                            : <span className="text-gray-200 text-xs">—</span>
                          }
                        </td>

                        {/* Name */}
                        <td className="px-3 py-2.5">
                          <span className={c.isRole ? 'text-gray-400 italic text-xs' : 'text-gray-800 font-medium text-sm'}>
                            {c.name || '—'}
                          </span>
                        </td>

                        {/* Company */}
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{c.company || '—'}</td>

                        {/* Phone */}
                        <td className="px-3 py-2.5">
                          {c.phone
                            ? <a href={phoneHref(c.phone)} className="text-blue-600 hover:underline font-mono text-xs whitespace-nowrap">{c.phone}</a>
                            : <span className="text-gray-300 text-xs">—</span>
                          }
                        </td>

                        {/* Mobile */}
                        <td className="px-3 py-2.5">
                          {c.mobile
                            ? <a href={phoneHref(c.mobile)} className="text-blue-600 hover:underline font-mono text-xs whitespace-nowrap">{c.mobile}</a>
                            : <span className="text-gray-300 text-xs">—</span>
                          }
                        </td>

                        {/* Email — truncated, narrow */}
                        <td className="px-3 py-2.5 w-44 max-w-[11rem]">
                          {c.email
                            ? <span className="text-gray-600 text-xs block truncate" title={c.email}>{c.email}</span>
                            : <span className="text-gray-300 text-xs">No email</span>
                          }
                        </td>

                        {/* State */}
                        <td className="px-3 py-2.5"><StateBadge label={c.stateLabel} /></td>

                        {/* Actions — min 44×44 tap targets */}
                        <td className="px-3 py-2.5 w-28">
                          <div className="flex items-center justify-center gap-2">
                            {c.email && (
                              <a
                                href={mailtoHref(c.email)}
                                title={selected.size > 0
                                  ? `Email all ${selected.size} selected contacts`
                                  : `Email ${c.email}`}
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </a>
                            )}
                            {(c.mobile || c.phone) && (
                              <a
                                href={phoneHref(c.mobile || c.phone)}
                                title={`Call ${c.mobile || c.phone}`}
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!loading && customers.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-sm">No customers match your filters.</div>
              )}
            </div>
          )}

          {/* ── Pagination ── */}
          {data && data.pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50">

              {/* Left: summary */}
              <span className="text-xs text-gray-500">
                Page <span className="font-semibold text-gray-700">{data.page}</span> of{' '}
                <span className="font-semibold text-gray-700">{data.pages}</span>
                {' '}·{' '}{data.total.toLocaleString()} contacts
              </span>

              {/* Centre: prev / page numbers / next */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  ← Prev
                </button>

                {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, data.pages - 4));
                  return start + i;
                }).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                      p === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  disabled={page >= data.pages}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>

              {/* Right: jump to page */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const n = parseInt(jumpInput);
                  if (!isNaN(n) && n >= 1 && n <= data.pages) {
                    setPage(n);
                    setJumpInput('');
                  }
                }}
                className="flex items-center gap-1.5"
              >
                <label className="text-xs text-gray-500 whitespace-nowrap">
                  Go to page
                </label>
                <input
                  type="number"
                  min={1}
                  max={data.pages}
                  value={jumpInput}
                  onChange={e => setJumpInput(e.target.value)}
                  placeholder={String(data.pages)}
                  className="w-16 px-2 py-1.5 text-xs text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Go
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}