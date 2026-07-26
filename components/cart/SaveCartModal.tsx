// components/cart/SaveCartModal.tsx
// ============================================================================
// "Save cart for later" — an overlay modal (opened from the cart drawer) that
// emails the current cart to the customer so they can resume later. Replaces
// the old standalone /save-cart page so the flow stays in-place (low friction:
// the user never leaves the page they were on).
// ============================================================================

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildServerOrderItems } from '../../lib/checkout/order-contract';

interface CartItem {
  id: string;
  name: string;
  type?: string;
  price?: number;
  totalPrice?: number;
  quantity: number;
}

interface SaveCartModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
}

// Yellow 3D-glass CTA — matches the cart drawer's "Continue Shopping" button.
function GlassButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px 28px',
        borderRadius: '40px',
        fontSize: '1.125rem',
        fontWeight: 600,
        color: '#000',
        position: 'relative',
        whiteSpace: 'nowrap',
        minWidth: '180px',
        background:
          'radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)',
        border: '1px solid rgba(255, 215, 0, 0.9)',
        boxShadow:
          '0 6px 20px rgba(250, 204, 21, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 8px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px) scale(1)';
      }}
    >
      {children}
    </button>
  );
}

export default function SaveCartModal({ open, onClose, items }: SaveCartModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portals need the DOM — only render on the client.
  useEffect(() => setMounted(true), []);

  // Reset all local state each time the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setEmail('');
      setName('');
      setStatus('idle');
      setError('');
      setShowUnsavedWarning(false);
    }
  }, [open]);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const lineTotal = (it: CartItem) =>
    it.type && it.type !== 'website_product'
      ? Number(it.totalPrice) || 0
      : (Number(it.price) || 0) * (Number(it.quantity) || 1);
  const estimatedSubtotal = items.reduce((s, it) => s + lineTotal(it), 0);

  // Attempting to leave: if the cart was already saved just close; otherwise
  // show the small "not saved" confirmation first.
  const requestClose = () => {
    if (status === 'sent') {
      onClose();
    } else {
      setShowUnsavedWarning(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setStatus('sending');
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
      const res = await fetch(`${API_BASE_URL}/api/cart/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          // Price-less server contract, so the backend can compute the
          // authoritative quote to hold for 7 days (slice-2 price lock).
          serverItems: buildServerOrderItems(items as any),
          email: email.trim(),
          name: name.trim(),
          origin: window.location.origin,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Could not save your cart.');
      }
      // Intentionally DO NOT clear the cart — the customer may keep shopping.
      setStatus('sent');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // Backdrop click (only when the mousedown starts on the backdrop itself).
        if (e.target === e.currentTarget) requestClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Close (X) */}
        <button
          aria-label="Close"
          onClick={requestClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '34px',
            height: '34px',
            padding: 0,
            boxSizing: 'border-box',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            fontSize: '20px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          &times;
        </button>

        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
            padding: '28px',
            textAlign: 'center',
            borderTopLeftRadius: '18px',
            borderTopRightRadius: '18px',
          }}
        >
          <div style={{ fontSize: '34px', marginBottom: '6px' }} aria-hidden="true">
            🛒
          </div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
            Save your cart for later
          </h2>
        </div>

        {/* Body */}
        {status === 'sent' ? (
          <div style={{ padding: '36px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }} aria-hidden="true">
              ✅
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
              Check your inbox!
            </h3>
            <p style={{ color: '#555', lineHeight: 1.6, margin: '0 0 24px' }}>
              We&apos;ve emailed your cart to <strong>{email}</strong>. Open it whenever
              you&apos;re ready and pick up right where you left off — same cart, same price
              promise (held for 7 days).
            </p>
            <GlassButton onClick={onClose}>Continue Shopping</GlassButton>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '36px 28px', textAlign: 'center' }}>
            <p style={{ color: '#555', margin: '0 0 24px' }}>
              Your cart is empty, so there&apos;s nothing to save yet.
            </p>
            <GlassButton onClick={onClose}>Keep Browsing</GlassButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
            <p style={{ color: '#555', lineHeight: 1.6, margin: '0 0 20px' }}>
              Enter your email and we&apos;ll send your cart so
              you can finish later — <strong>we&apos;ll hold today&apos;s pricing for 7 days</strong>.
              We don&apos;t create an account or store your details.
            </p>

            {/* Cart summary */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '22px' }}>
              {items.map((it, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    borderBottom: '1px solid #f1f1f1',
                  }}
                >
                  <span style={{ color: '#333' }}>
                    {it.name} <span style={{ color: '#9ca3af' }}>x{it.quantity || 1}</span>
                  </span>
                  <span style={{ color: '#111', fontWeight: 500 }}>
                    A${lineTotal(it).toFixed(2)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f9fafb',
                  borderBottomLeftRadius: '10px',
                  borderBottomRightRadius: '10px',
                }}
              >
                <span style={{ fontWeight: 600, color: '#374151' }}>Estimated subtotal</span>
                <span style={{ fontWeight: 700, color: '#111' }}>
                  A${estimatedSubtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={status === 'sending'}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '1rem',
              }}
            />

            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Name <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
              disabled={status === 'sending'}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '1rem',
              }}
            />

            {error && <p style={{ color: '#dc2626', fontSize: '0.9rem', margin: '0 0 14px' }}>{error}</p>}

            <button
              type="submit"
              disabled={status === 'sending'}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '40px',
                border: 'none',
                background: '#111827',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: status === 'sending' ? 'default' : 'pointer',
                opacity: status === 'sending' ? 0.6 : 1,
              }}
            >
              {status === 'sending' ? 'Sending…' : 'Email My Cart'}
            </button>

            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
              Your email is used only to send this cart link and isn&apos;t stored. The link stays
              valid for 30 days.
            </p>
          </form>
        )}

        {/* "Cart not saved" confirmation on close */}
        {showUnsavedWarning && (
          <div
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowUnsavedWarning(false);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 3,
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '14px',
                padding: '24px',
                maxWidth: '340px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              }}
            >
              <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: '#111' }}>
                Your cart isn&apos;t saved
              </h4>
              <p style={{ margin: '0 0 18px', fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.5 }}>
                You can save it any time from the cart.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowUnsavedWarning(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '30px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Keep editing
                </button>
                <button
                  onClick={() => {
                    setShowUnsavedWarning(false);
                    onClose();
                  }}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '30px',
                    border: 'none',
                    background: '#111827',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
