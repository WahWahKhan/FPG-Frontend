/**
 * TUBE360 form fields — same glass "pill" look as the Function360 equipment
 * page dropdowns (pages/suite360/function360/equipment.tsx), plus Hose360-style
 * errors (red border + short red message under the field).
 */

import React from 'react';
import { COLORS } from '../Trac360/styles';

const pillStyle = (hasValue: boolean, hasError: boolean, disabled?: boolean): React.CSSProperties => ({
  background: disabled ? 'rgba(229, 231, 235, 0.6)' : 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: `2px solid ${hasError ? COLORS.error : hasValue ? COLORS.yellow.primary : 'rgba(255, 255, 255, 0.8)'}`,
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
  opacity: disabled ? 0.7 : 1,
});

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <div className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: COLORS.grey.medium }}>
      {label}
      {required && <span style={{ color: COLORS.yellow.primary }}> *</span>}
    </div>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-center mt-1" style={{ color: COLORS.error }}>
      {message}
    </p>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-center mt-1" style={{ color: COLORS.grey.medium }}>
      {children}
    </p>
  );
}

// ============================================================================
// SELECT
// ============================================================================

export interface GlassSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface GlassSelectProps {
  id: string;
  label: string;
  required?: boolean;
  value: string | null;
  placeholder: string;
  options: GlassSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  hint?: React.ReactNode;
}

export function GlassSelect({ id, label, required, value, placeholder, options, onChange, disabled, error, hint }: GlassSelectProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`block w-full px-4 py-3 sm:py-4 text-center rounded-full ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={pillStyle(Boolean(value), Boolean(error), disabled)}
      >
        <FieldLabel label={label} required={required} />
        <select
          id={id}
          value={value || ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full text-center text-base font-medium bg-transparent border-none outline-none cursor-pointer appearance-none"
          style={{ color: COLORS.grey.dark, minHeight: '28px' }}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <FieldError id={`${id}-error`} message={error} />
      {!error && hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}

// ============================================================================
// NUMBER INPUT (kept as a text input so we can show Hose360-style messages)
// ============================================================================

interface GlassNumberInputProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  unit?: string;
  placeholder?: string;
  error?: string;
  hint?: React.ReactNode;
  /** 'numeric' for whole numbers, 'decimal' for angles. */
  inputMode?: 'numeric' | 'decimal';
  maxLength?: number;
  readOnly?: boolean;
}

export function GlassNumberInput({
  id,
  label,
  required,
  value,
  onChange,
  onBlur,
  unit,
  placeholder,
  error,
  hint,
  inputMode = 'numeric',
  maxLength = 6,
  readOnly,
}: GlassNumberInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block w-full px-4 py-3 sm:py-4 text-center rounded-full" style={pillStyle(value !== '', Boolean(error), readOnly)}>
        <FieldLabel label={label} required={required} />
        <div className="flex items-center justify-center gap-2">
          <input
            id={id}
            type="text"
            inputMode={inputMode}
            autoComplete="off"
            maxLength={maxLength}
            value={value}
            readOnly={readOnly}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value.trim())}
            onBlur={onBlur}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className="w-full max-w-[180px] text-center text-base font-medium bg-transparent border-none outline-none"
            style={{ color: COLORS.grey.dark, minHeight: '28px' }}
          />
          {unit && (
            <span className="text-sm font-semibold" style={{ color: COLORS.grey.medium }}>
              {unit}
            </span>
          )}
        </div>
      </label>
      <FieldError id={`${id}-error`} message={error} />
      {!error && hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}

// ============================================================================
// TEXTAREA (optional notes)
// ============================================================================

interface GlassTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
}

export function GlassTextarea({ id, label, value, onChange, maxLength, placeholder }: GlassTextareaProps) {
  return (
    <div>
      <label htmlFor={id} className="block w-full px-5 py-4 rounded-3xl" style={pillStyle(value !== '', false)}>
        <FieldLabel label={label} />
        <textarea
          id={id}
          rows={4}
          maxLength={maxLength}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm bg-transparent border-none outline-none resize-y"
          style={{ color: COLORS.grey.dark }}
        />
        <div className="text-right text-xs" style={{ color: COLORS.grey.medium }}>
          {value.length}/{maxLength}
        </div>
      </label>
    </div>
  );
}

// ============================================================================
// SMALL LAYOUT PIECES
// ============================================================================

/** Dark pill page title, same as "FUNCTION SELECTION" on Function360. */
export function PagePill({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center mb-8">
      <div
        className="inline-block px-6 sm:px-8 py-3 rounded-full text-white text-base sm:text-lg font-semibold"
        style={{ background: COLORS.grey.dark }}
      >
        {children}
      </div>
    </div>
  );
}

/** "Fields marked with * are required" — same wording/colour as Function360. */
export function RequiredNote() {
  return (
    <div className="text-center mt-4 text-sm" style={{ color: COLORS.grey.medium }}>
      Fields marked with <span style={{ color: COLORS.yellow.primary }}>*</span> are required
    </div>
  );
}

/** Yellow-tinted glass notice box. */
export function NoticeBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-5 py-4 text-sm"
      style={{
        background: 'rgba(250, 204, 21, 0.08)',
        border: '1px solid rgba(250, 204, 21, 0.45)',
        color: COLORS.grey.dark,
      }}
    >
      <div className="font-bold mb-1 uppercase tracking-wide text-xs" style={{ color: '#a16207' }}>
        {title}
      </div>
      {children}
    </div>
  );
}
