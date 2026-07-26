import { FiAlertCircle, FiX } from 'react-icons/fi';

interface SavedCartNoticeProps {
  message: string;
  onDismiss: () => void;
}

/**
 * Small fixed banner shown when a "save cart for later" email link can no longer
 * be used — either because the cart was already ordered (single-use link) or the
 * link expired. Rendered by CartWrapper when a resume attempt is rejected.
 * Inline-styled so it renders reliably regardless of Tailwind purge config.
 */
const SavedCartNotice = ({ message, onDismiss }: SavedCartNoticeProps) => (
  <div
    role="status"
    aria-live="polite"
    style={{
      position: 'fixed',
      // Sit just below the fixed 90px site header (Header.tsx) so it never
      // overlaps the nav.
      top: 100,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      maxWidth: 'min(560px, calc(100vw - 32px))',
      width: 'max-content',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '14px 16px',
      borderRadius: 12,
      background: '#FEF3C7',
      border: '1px solid #F59E0B',
      color: '#78350F',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      fontSize: 14,
      lineHeight: 1.45,
    }}
  >
    <FiAlertCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
    <span style={{ flex: 1 }}>{message}</span>
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss notification"
      style={{
        flexShrink: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: '#78350F',
        padding: 2,
        lineHeight: 0,
      }}
    >
      <FiX size={18} aria-hidden="true" />
    </button>
  </div>
);

export default SavedCartNotice;
