// components/invoice/AutocompleteInput.tsx
// Reusable autocomplete input with debounced API calls and keyboard navigation.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CustomerSuggestion } from '../../pages/api/invoices/get-customers';

interface AutocompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (customer: CustomerSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  inputClassName?: string;
  /** Which field to display as the primary label in each dropdown row */
  displayField: 'name' | 'company';
}

export default function AutocompleteInput({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  required,
  inputClassName,
  displayField,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions with 300ms debounce
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/invoices/get-customers?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSuggestions(data.customers || []);
      setIsOpen((data.customers || []).length > 0);
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [value, fetchSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: CustomerSuggestion) => {
    onSelect(customer);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const baseInputClass =
    inputClassName ||
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent';

  const listboxId = `autocomplete-listbox-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      <div
        className="relative"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          className={baseInputClass}
          autoComplete="off"
          aria-autocomplete="list"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="px-3 py-1.5 text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
            ↑↓ to navigate · Enter or click to autofill
          </div>
          {suggestions.map((customer, index) => {
            const primary =
              displayField === 'company' ? customer.company : customer.name;
            const secondary =
              displayField === 'company' ? customer.name : customer.company;

            return (
              <div
                key={`${customer.email}-${index}`}
                role="option"
                aria-selected={index === highlightedIndex}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={e => {
                  // mousedown fires before blur, preventing the input from losing focus first
                  e.preventDefault();
                  handleSelect(customer);
                }}
                className={`px-3 py-2.5 cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? 'bg-yellow-50 border-l-2 border-yellow-400'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {primary || <span className="text-gray-400 italic">No name</span>}
                  </span>
                  {secondary && (
                    <span className="text-xs text-gray-400 truncate shrink-0">
                      {secondary}
                    </span>
                  )}
                </div>
                {customer.email && (
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {customer.email}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}