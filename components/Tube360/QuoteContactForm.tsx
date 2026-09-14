/**
 * TUBE360 QuoteContactForm — "Your details" for the upload-for-quote flow.
 *
 * Same fields, labels, markup and validation rules as the checkout form
 * (components/checkout/ShippingForm.tsx + lib/checkout/form-validation.ts) so
 * it feels identical — but WITHOUT ShippingForm's hidden activation codes
 * (dev mode / invoice builder / FPG cart email), which must never trigger here.
 *
 * Contact details live only in this component's state (never localStorage).
 */

import { useState } from 'react';
import { STATES } from '../../lib/checkout/checkout-config';
import {
  ShippingDetails,
  ValidationErrors,
  validateField,
  validateAllFields,
  hasValidationErrors,
  createEmptyShippingDetails,
} from '../../lib/checkout/form-validation';

interface QuoteContactFormProps {
  onSubmit: (details: ShippingDetails) => void;
  submitting: boolean;
  /** Error message from the server, shown above the button. */
  serverError?: string;
  /** Per-field errors returned by the server (same keys as ShippingDetails). */
  serverFieldErrors?: ValidationErrors;
}

type FieldDef = {
  name: keyof ShippingDetails;
  label: string;
  required: boolean;
  type?: string;
  inputMode?: 'text' | 'numeric' | 'email' | 'tel';
  maxLength?: number;
  autoComplete?: string;
};

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'Name', required: true, autoComplete: 'name' },
  { name: 'companyName', label: 'Company Name', required: false, autoComplete: 'organization' },
  { name: 'address', label: 'Address', required: true, autoComplete: 'street-address' },
  { name: 'suburb', label: 'Suburb', required: true, autoComplete: 'address-level2' },
  // state rendered separately (select)
  { name: 'postcode', label: 'Postcode', required: true, inputMode: 'numeric', maxLength: 4, autoComplete: 'postal-code' },
  { name: 'email', label: 'Email', required: true, type: 'email', inputMode: 'email', autoComplete: 'email' },
  { name: 'contactNumber', label: 'Contact Number', required: true, inputMode: 'numeric', maxLength: 10, autoComplete: 'tel' },
];

export default function QuoteContactForm({ onSubmit, submitting, serverError, serverFieldErrors }: QuoteContactFormProps) {
  const [details, setDetails] = useState<ShippingDetails>(createEmptyShippingDetails());
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [attempted, setAttempted] = useState(false);

  const shownErrors: ValidationErrors = { ...(serverFieldErrors || {}), ...errors };

  const change = (name: keyof ShippingDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [name]: value }));
    if (attempted) setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const blur = (name: keyof ShippingDetails) => {
    if (attempted) setErrors((prev) => ({ ...prev, [name]: validateField(name, details[name]) }));
  };

  const submit = () => {
    setAttempted(true);
    const v = validateAllFields(details);
    setErrors(v);
    if (!hasValidationErrors(v)) onSubmit(details);
  };

  const inputClass = (name: keyof ShippingDetails) =>
    `w-full px-3 py-2 border-2 rounded-lg ${(attempted || serverFieldErrors) && shownErrors[name] ? 'border-red-500' : 'border-gray-300'}`;

  const renderField = (f: FieldDef) => (
    <div key={f.name}>
      <label htmlFor={`tube360-${f.name}`} className="block text-sm font-bold text-gray-700 mb-1">
        {f.label} {f.required ? <span className="text-red-600">*</span> : <span className="text-gray-500">(Optional)</span>}
      </label>
      <input
        id={`tube360-${f.name}`}
        type={f.type || 'text'}
        inputMode={f.inputMode}
        maxLength={f.maxLength}
        autoComplete={f.autoComplete}
        value={details[f.name]}
        onChange={(e) => change(f.name, e.target.value)}
        onBlur={() => blur(f.name)}
        className={inputClass(f.name)}
      />
      {shownErrors[f.name] && <p className="text-red-600 text-sm mt-1">{shownErrors[f.name]}</p>}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Details</h2>
      <p className="text-sm text-red-600 mb-4">Fields marked with * are required</p>

      <div className="space-y-4">
        {FIELDS.slice(0, 4).map(renderField)}

        {/* State */}
        <div>
          <label htmlFor="tube360-state" className="block text-sm font-bold text-gray-700 mb-1">
            State <span className="text-red-600">*</span>
          </label>
          <select
            id="tube360-state"
            value={details.state}
            onChange={(e) => change('state', e.target.value)}
            onBlur={() => blur('state')}
            className={inputClass('state')}
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {shownErrors.state && <p className="text-red-600 text-sm mt-1">{shownErrors.state}</p>}
        </div>

        {FIELDS.slice(4).map(renderField)}

        {serverError && (
          <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
            <p className="text-red-700 font-semibold">{serverError}</p>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="mt-6 py-3 px-8 font-bold rounded-full transition-all duration-300 flex items-center gap-3"
            style={{
              background: submitting
                ? 'rgba(200, 200, 200, 0.6)'
                : 'radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)',
              border: '1px solid rgba(255, 215, 0, 0.9)',
              color: '#000',
              boxShadow: submitting ? 'none' : '0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8)',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting && (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {submitting ? 'Submitting...' : 'Submit for Quote'}
          </button>
        </div>
      </div>
    </div>
  );
}
