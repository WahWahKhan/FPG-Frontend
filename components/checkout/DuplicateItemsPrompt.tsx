import { useContext, useMemo, useState } from 'react';
import { CartContext } from '../../context/CartWrapper';
import { DuplicateGroup, findDuplicateGroups, isSteelTubesShippingActive } from '../../utils/cartDuplicates';

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
// Two DIFFERENT flows, because merging means two different things:
//
// STEEL TUBES — always a genuine "combine or keep separate?" decision
// (§4.6): a customer might want two 1m pieces kept as two pieces for reasons
// that have nothing to do with cost. So EVERY Steel Tubes duplicate group
// gets asked, one at a time via dismissedIds, never batched, never silent.
// What varies is the SECOND popup — the one that discloses the $80 freight
// cost — which only fires when combining THIS group would actually be what
// introduces that cost. Once isSteelTubesShippingActive(items) is already
// true (an earlier group the customer combined, or a line already at
// qty > 1 for some other reason), the $80 is already being charged
// regardless of this group's answer, so re-disclosing it would be telling
// the customer something they've already been told. "Yes, combine" then
// merges immediately, skipping straight past the disclosure step — the ask
// stays, only the redundant cost popup drops.
//
// EVERYTHING ELSE — no decision left to make at all (not even a
// keep-separate-for-its-own-sake one): merging never changes the total,
// full stop, since shipping is a flat $12.85 regardless of line count for
// non-Steel-Tube products (utils/cart-helpers.ts has only the one shipping
// fork, which checks isSteelTubesLine and nothing else). These are pure
// notices, collected into ONE dialog rather than shown one at a time — a
// cart with several unrelated duplicated products shouldn't make the
// customer click through several near-identical "OK" dialogs. A single OK
// merges all of them and dismisses in the same click.
const DuplicateItemsPrompt = () => {
  const { items, mergeItems } = useContext(CartContext);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [pendingSteelTubeGroup, setPendingSteelTubeGroup] = useState<DuplicateGroup | null>(null);

  const groups = useMemo(() => findDuplicateGroups(items), [items]);

  // Steel Tube groups: always worked through one at a time, always asked —
  // see the comment above for why this never batches or skips the ask.
  const activeSteelGroup: DuplicateGroup | undefined = groups.find(
    (g) => g.isSteelTube && !dismissedIds.has(g.id)
  );

  // Non-Steel-Tube groups: no decision, so collected into one notice.
  const pendingOtherGroups: DuplicateGroup[] = groups.filter(
    (g) => !g.isSteelTube && !dismissedIds.has(g.id)
  );
  const showOtherNotice =
    !activeSteelGroup && !pendingSteelTubeGroup && pendingOtherGroups.length > 0;

  if (!activeSteelGroup && !pendingSteelTubeGroup && !showOtherNotice) return null;

  const handleCombineSteelTube = () => {
    if (!activeSteelGroup) return;
    // Recomputed against live cart state at the moment of the click (not
    // memoized), so it reflects any merge that already happened earlier in
    // this same session — see isSteelTubesShippingActive's comment.
    if (isSteelTubesShippingActive(items)) {
      // The $80 rate is already in effect for another line — combining this
      // group doesn't introduce a new cost, so there's nothing left to
      // disclose. Merge straight away, same as the no-decision case.
      mergeItems(activeSteelGroup.id);
      setDismissedIds((prev) => new Set(prev).add(activeSteelGroup.id));
      return;
    }
    // Don't merge yet — show the shipping-context popup first.
    setPendingSteelTubeGroup(activeSteelGroup);
  };

  const handleKeepSeparate = () => {
    if (!activeSteelGroup) return;
    setDismissedIds((prev) => new Set(prev).add(activeSteelGroup.id));
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

  const handleCombineOthers = () => {
    pendingOtherGroups.forEach((g) => mergeItems(g.id));
    setDismissedIds((prev) => {
      const next = new Set(prev);
      pendingOtherGroups.forEach((g) => next.add(g.id));
      return next;
    });
  };

  return (
    <>
      {/* Steel Tubes: a real pricing fork, so the customer gets an actual
          choice — two buttons, either answer valid. */}
      {activeSteelGroup && !pendingSteelTubeGroup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Combine Tubes?</h3>
            <p className="text-sm text-gray-600 mb-6">
              We&apos;ve detected more than 1 metre of{' '}
              <span className="font-semibold">{activeSteelGroup.name}</span> in your cart, split
              across {activeSteelGroup.lineCount} lines. Would you like us to combine them into
              one length, or keep them as separate 1 metre lengths?
            </p>
            <div className="flex gap-3 justify-end">
              <SecondaryPillButton onClick={handleKeepSeparate}>No, keep separate</SecondaryPillButton>
              <PrimaryPillButton onClick={handleCombineSteelTube}>Yes, combine</PrimaryPillButton>
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

      {/* Non-Steel-Tubes, batched: one notice covers every duplicated product
          at once, however many there are. Nothing to decide, so one OK. */}
      {showOtherNotice && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Items combined</h3>
            {pendingOtherGroups.length === 1 ? (
              <p className="text-sm text-gray-600 mb-6">
                We noticed <span className="font-semibold">{pendingOtherGroups[0].name}</span> was
                added to your cart {pendingOtherGroups[0].lineCount} separate times. We&apos;ve
                grouped these into one line of qty {pendingOtherGroups[0].totalQuantity} — your
                total is unaffected.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  We noticed the following items were each added to your cart as separate lines.
                  We&apos;ve combined each into a single line, keeping the same total quantities —
                  your total is unaffected:
                </p>
                <ul className="text-sm text-gray-600 mb-6 space-y-1 list-disc pl-5">
                  {pendingOtherGroups.map((g) => (
                    <li key={g.id}>
                      <span className="font-semibold">{g.name}</span> — qty {g.totalQuantity}{' '}
                      (was {g.lineCount} lines)
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="flex justify-end">
              <PrimaryPillButton onClick={handleCombineOthers}>OK</PrimaryPillButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DuplicateItemsPrompt;
