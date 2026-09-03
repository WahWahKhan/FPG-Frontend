import { useContext, useMemo, useState } from 'react';
import { CartContext } from '../../context/CartWrapper';
import { DuplicateGroup, findDuplicateGroups } from '../../utils/cartDuplicates';

// Same black-glass-resting / yellow-glass-hover pill used across the site's
// hero CTAs (InfoHeroHome.tsx). Duplicated locally rather than shared, since
// that's a local, not exported, copy of the same visual language too.
const PrimaryPillButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden"
      style={{
        padding: '10px 24px',
        borderRadius: '40px',
        fontSize: '0.95rem',
        fontWeight: 600,
        color: isHovered ? '#000' : '#fff',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isHovered
          ? `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.8) 60%, rgba(255, 215, 0, 0.9) 100%), rgba(250, 204, 21, 0.7)`
          : `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`,
        backdropFilter: 'blur(15px)',
        border: isHovered ? '1px solid rgba(255, 215, 0, 0.9)' : '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: isHovered
          ? `0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)`
          : `0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2)`,
        transform: isHovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '1px',
          left: '8px',
          right: '8px',
          height: '50%',
          background: isHovered
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(250, 204, 21, 0.1) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
          borderRadius: '40px 40px 20px 20px',
          pointerEvents: 'none',
        }}
      />
      {children}
    </button>
  );
};

// Same pill shape and glass treatment as PrimaryPillButton, tuned light for
// contrast against this dialog's white panel (the header nav's own white-glass
// pill only reads well against a dark backdrop — this panel isn't one).
const SecondaryPillButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden"
      style={{
        padding: '10px 24px',
        borderRadius: '40px',
        fontSize: '0.95rem',
        fontWeight: 600,
        color: '#374151',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isHovered
          ? 'radial-gradient(ellipse at center, #f3f4f6 20%, #e5e7eb 100%)'
          : 'radial-gradient(ellipse at center, #ffffff 20%, #f9fafb 100%)',
        backdropFilter: 'blur(15px)',
        border: '1px solid #e5e7eb',
        boxShadow: isHovered
          ? '0 6px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
          : '0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      {children}
    </button>
  );
};

// Soft confirmation for the split-cart-line issue (see utils/cartDuplicates.ts
// for the root cause). Runs only on checkout, only after the customer has
// explicitly said yes — never merges anything on its own. Actual merging goes
// through CartContext.mergeItems, not a plain setCart — see that function's
// comment in CartWrapper.tsx for why a raw setCart gets silently reverted.
//
// Two-step flow for a Steel Tubes group: "combine into one length, or keep as
// separate 1m lengths?" then, only if the customer wants to combine, a second
// popup explains the $80 freight charge BEFORE the merge actually happens,
// with real Proceed/Cancel buttons (not an auto-dismissing toast).
// This is a genuine pricing fork, not just a display choice — both the
// frontend (utils/cart-helpers.ts) and backend (lib/pricing/index.js) trigger
// the $80 rate PER LINE, not aggregated across lines of the same product. So
// "keep separate" (two 1m lines) stays at standard shipping, while combining
// into one line of qty 2 (one continuous piece over 1m) genuinely adds the
// $80 — the second popup exists specifically so the customer sees that cost
// BEFORE agreeing to it, not after.
const DuplicateItemsPrompt = () => {
  const { items, mergeItems } = useContext(CartContext);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [pendingSteelTubeGroup, setPendingSteelTubeGroup] = useState<DuplicateGroup | null>(null);

  const groups = useMemo(() => findDuplicateGroups(items), [items]);
  const activeGroup: DuplicateGroup | undefined = groups.find((g) => !dismissedIds.has(g.id));

  if (!activeGroup && !pendingSteelTubeGroup) return null;

  const handleCombine = () => {
    if (!activeGroup) return;
    if (activeGroup.isSteelTube) {
      // Don't merge yet — show the shipping-context popup first.
      setPendingSteelTubeGroup(activeGroup);
      return;
    }
    mergeItems(activeGroup.id);
    setDismissedIds((prev) => new Set(prev).add(activeGroup.id));
  };

  const handleKeepSeparate = () => {
    if (!activeGroup) return;
    setDismissedIds((prev) => new Set(prev).add(activeGroup.id));
  };

  const handleConfirmMerge = () => {
    if (!pendingSteelTubeGroup) return;
    mergeItems(pendingSteelTubeGroup.id);
    setDismissedIds((prev) => new Set(prev).add(pendingSteelTubeGroup.id));
    setPendingSteelTubeGroup(null);
  };

  const handleCancelMerge = () => {
    if (!pendingSteelTubeGroup) return;
    setDismissedIds((prev) => new Set(prev).add(pendingSteelTubeGroup.id));
    setPendingSteelTubeGroup(null);
  };

  return (
    <>
      {activeGroup && !pendingSteelTubeGroup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Combine {activeGroup.isSteelTube ? 'Tubes' : 'items'}?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {activeGroup.isSteelTube ? (
                <>
                  We&apos;ve detected more than 1 metre of{' '}
                  <span className="font-semibold">{activeGroup.name}</span> in your cart, split
                  across {activeGroup.lineCount} lines. Would you like us to combine them into one
                  length, or keep them as separate 1 metre lengths?
                </>
              ) : (
                <>
                  We noticed <span className="font-semibold">{activeGroup.name}</span> is in your
                  cart as {activeGroup.lineCount} separate lines. Would you like to combine them
                  into one line of qty {activeGroup.totalQuantity}? Your total stays the same
                  either way.
                </>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <SecondaryPillButton onClick={handleKeepSeparate}>No, keep separate</SecondaryPillButton>
              <PrimaryPillButton onClick={handleCombine}>Yes, combine</PrimaryPillButton>
            </div>
          </div>
        </div>
      )}

      {pendingSteelTubeGroup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Just so you know</h3>
            <p className="text-sm text-gray-600 mb-6">
              Combining these into one length of{' '}
              <span className="font-semibold">{pendingSteelTubeGroup.name}</span> means ordering a
              single continuous piece longer than 1 metre, which incurs an A$80 freight charge.
              Cancel keeps them as separate 1 metre lengths at standard shipping — Proceed combines
              them and applies the A$80.
            </p>
            <div className="flex gap-3 justify-end">
              <SecondaryPillButton onClick={handleCancelMerge}>Cancel</SecondaryPillButton>
              <PrimaryPillButton onClick={handleConfirmMerge}>Proceed</PrimaryPillButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DuplicateItemsPrompt;
