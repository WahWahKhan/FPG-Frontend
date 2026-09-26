/**
 * HOSE360 Step 8 — Cut Lengths. Only the "normal" (full assembly) mode is
 * built — Hose-Only / Order-Fitting-Only modes are NOT built (DECISIONS.md
 * §1). Ask quantity of hoses (1-20), then render that many cut-length
 * number inputs (mm, min per options.quantityLimits.cutLengthMinMm).
 *
 * The two dev/QA backdoors (qty '696', cut-length '20162025') are
 * deliberately NOT implemented — DECISIONS.md hard rule.
 *
 * Round 2 (DECISIONS_ADDENDUM_2.md §4 / 04_UX_FIDELITY_FIX_PLAN.md Step
 * U4):
 * U4a — the quantity field used to be clamped `number` state whose
 * `onChange` did `parseInt(...) || hoseQuantityMin`, which snapped an
 * emptied field back to 1 on every keystroke (before the user could type a
 * replacement). Fixed by holding it as free-text string state
 * (`quantityInput`), parsed/clamped only at point-of-use (isValid, on
 * blur, on Continue) — mirrors CutLengthsScreen.js's useState('') pattern.
 * U4b — fixed pill widths (120px quantity / 230px cut-length, matching the
 * OG) instead of w-full.
 * U4c — ported the OG's progressive scroll-into-view: quantity change ->
 * scroll/focus first cut-length field; a field becoming valid (on blur) and
 * not being last -> scroll/focus next field; last field becoming valid ->
 * scroll the price total into view.
 *
 * Round 3.6 — the owner caught that the "live" pricing from round 3 was
 * still not actually visible in the one moment that matters most: clicking
 * Continue called setCutLengths() then immediately router.push()ed, but
 * setCutLengths only feeds the context's OWN debounced (200ms) auto-price
 * effect, which still has to finish its network round trip afterwards — the
 * page navigates away long before that resolves, so the customer never
 * actually sees the total reflecting what they just typed. Fix:
 * handleContinue now directly awaits its own fetchHose360Price(...) call,
 * commits the real result via the new applyPriceResult context setter (so
 * the price bar HERE updates to the true number), holds briefly so it's
 * actually visible, and only then navigates — instead of trusting a
 * background effect to finish before the page is gone.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Hose360Layout from '../../../components/Hose360/Layout/Hose360Layout';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import { useHose360 } from '../../../context/Hose360Context';
import { fetchHose360Price } from '../../../lib/hose360/api';
import { COLORS } from '../../../components/Trac360/styles';
import { GLASS_BASE } from '../../../utils/trac360/glassmorphism';
import FittingsReminder from '../../../components/Hose360/Shared/FittingsReminder';
import Hose360OptionsGate from '../../../components/Hose360/Layout/Hose360OptionsGate';
import type { Hose360Options } from '../../../types/hose360';

function CutLengthsInner({ options }: { options: Hose360Options }) {
  const router = useRouter();
  const { config, setCutLengths, applyPriceResult } = useHose360();
  const { hoseQuantityMin, hoseQuantityMax, cutLengthMinMm } = options.quantityLimits;
  const [isPricing, setIsPricing] = useState(false);

  // U4a — free-text string state, no premature clamping in onChange.
  // Round 3 item 7.1 — distinguish a genuine returning visit (user already
  // chose a quantity and cut lengths exist) from a fresh first visit, where
  // config.quantity is just initialConfig's default of 1 and was never
  // actually chosen by the user. Only pre-fill when there's real evidence
  // of a prior choice (cutLengths already populated, or quantity != the
  // untouched default of 1) — otherwise start empty per the owner's request.
  const hasPriorSelection = config.cutLengths.length > 0 || config.quantity !== 1;
  const [quantityInput, setQuantityInput] = useState<string>(hasPriorSelection ? String(config.quantity || hoseQuantityMin) : '');
  const [lengths, setLengths] = useState<string[]>(
    config.cutLengths.length ? config.cutLengths.map((c) => c.length) : Array.from({ length: hoseQuantityMin }, () => '')
  );

  const parsedQuantity = parseInt(quantityInput, 10);
  const quantityValid =
    !isNaN(parsedQuantity) && parsedQuantity >= hoseQuantityMin && parsedQuantity <= hoseQuantityMax;
  // Only used to size the rendered field list — falls back to the last
  // valid quantity while the field is transiently invalid/empty so the
  // field list doesn't collapse while typing.
  const effectiveQuantity = quantityValid ? parsedQuantity : lengths.length || hoseQuantityMin;

  const prevEffectiveQuantity = useRef(effectiveQuantity);

  useEffect(() => {
    if (!config.end2Shape || !config.end2Size) {
      router.replace('/suite360/hose360');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.end2Shape, config.end2Size]);

  useEffect(() => {
    setLengths((prev) => {
      const next = [...prev];
      while (next.length < effectiveQuantity) next.push('');
      while (next.length > effectiveQuantity) next.pop();
      return next;
    });

    // U4c trigger 1 — quantity changed and fields (re)rendered: scroll +
    // focus the first cut-length field, matching CutLengthsScreen.js's
    // ~150ms-after-mount rAF-wrapped scrollIntoViewById('cutLengthInput-0').
    if (prevEffectiveQuantity.current !== effectiveQuantity) {
      prevEffectiveQuantity.current = effectiveQuantity;
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById('cutLengthInput-0') as HTMLInputElement | null;
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        });
      }, 150);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveQuantity]);

  if (!config.end2Shape) return null;

  const isLengthValid = (l: string) => {
    const n = parseInt(l, 10);
    return !isNaN(n) && n >= cutLengthMinMm;
  };

  const isValid =
    quantityValid &&
    lengths.length === effectiveQuantity &&
    lengths.every((l) => isLengthValid(l));

  // Round 3 item 7.3 — the real live-pricing bug: setCutLengths (the only
  // thing the context's debounced auto-price effect watches) used to be
  // called ONLY from handleContinue, so the price bar sat frozen while the
  // user was actually typing on this page. Push a sync into context on every
  // real "step forward" (a field becoming valid on blur/Enter), using the
  // full current snapshot of all fields — partial/invalid typing never
  // triggers a sync, only a field settling into a valid state does.
  const syncContextIfValid = (currentLengths: string[]) => {
    if (!quantityValid) return;
    if (currentLengths.length !== effectiveQuantity) return;
    if (!currentLengths.every((l) => isLengthValid(l))) return;
    setCutLengths(
      effectiveQuantity,
      currentLengths.map((l) => ({ length: l }))
    );
  };

  // U4c triggers 2 & 3 — a field becomes valid on blur: scroll to the next
  // field, or to the total price if it was the last one.
  const handleLengthBlur = (idx: number) => {
    if (!isLengthValid(lengths[idx])) return;
    syncContextIfValid(lengths);
    requestAnimationFrame(() => {
      if (idx < lengths.length - 1) {
        const next = document.getElementById(`cutLengthInput-${idx + 1}`) as HTMLInputElement | null;
        if (next) {
          next.scrollIntoView({ behavior: 'smooth', block: 'center' });
          next.focus();
        }
      } else {
        const total = document.getElementById('hoseTotalPrice');
        if (total) total.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const handleContinue = async () => {
    if (!isValid || isPricing) return;
    const finalLengths = lengths.map((l) => ({ length: l }));
    setCutLengths(effectiveQuantity, finalLengths);
    setIsPricing(true);

    try {
      const res = await fetchHose360Price({
        selectedHose: config.selectedHose,
        end1Shape: config.end1Shape,
        end1Size: config.end1Size,
        end2Shape: config.end2Shape,
        end2Size: config.end2Size,
        cutLengths: finalLengths,
        selectedProtection: config.selectedProtection,
        selectedPressure: config.selectedPressure,
        quantity: effectiveQuantity,
        isOrderFittingMode: false,
      });
      applyPriceResult(res.amount, res.breakdown || null, res.swellProductIds || []);
      // Hold on this page just long enough for the updated total to
      // actually be visible before navigating away — the whole point of
      // this fix is that the customer sees the real number, not just that
      // it's technically correct on the next page.
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      // If the fetch fails, don't strand the customer on this page with a
      // frozen Continue button — proceed anyway; the next page's own
      // OptionsGate/price effect will retry pricing normally.
      console.error('[HOSE360] final price fetch before continue failed:', err);
    } finally {
      setIsPricing(false);
    }

    router.push('/suite360/hose360/hose-protection');
  };

  return (
    <Hose360Layout currentStep={8} totalSteps={11}>
      {/* Round 3.5 fix: same ping-pong issue as end2-fitting.tsx/
          orientation.tsx — a bare router.back() here bounces forever once
          any earlier step's Back also used router.push(). Push explicitly:
          if the user actually went through Orientation (selectedAngle is
          only ever set by completing that step — cleared on every fitting
          change per the U7 fix), go back there; otherwise go straight back
          to the end2-* route they used (orientation was skipped for them). */}
      <BackButton
        onClick={() =>
          router.push(
            config.selectedAngle
              ? '/suite360/hose360/orientation'
              : `/suite360/hose360/${config.end2Route || 'end2-fitting'}`
          )
        }
      />

      <FittingsReminder />

      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold" style={{ background: COLORS.grey.dark }}>
            CUT LENGTHS &amp; QUANTITY
          </div>
        </div>

        <div className="mb-8 flex flex-col items-center" style={{ ...GLASS_BASE, borderRadius: 16, padding: 20 }}>
          <label className="block text-sm font-semibold mb-2 text-center" style={{ color: COLORS.grey.dark }}>
            Number of hoses ({hoseQuantityMin}-{hoseQuantityMax})
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={quantityInput}
            onChange={(e) => {
              // Free-text: allow empty/partial input while typing, no clamping here.
              const raw = e.target.value;
              if (raw === '' || /^[0-9]+$/.test(raw)) {
                setQuantityInput(raw);
              }
            }}
            onBlur={(e) => {
              // Clamp only at point-of-use (blur) so a stray blur doesn't
              // leave an out-of-range value sitting in the field forever.
              const n = parseInt(quantityInput, 10);
              if (isNaN(n)) return; // leave empty — isValid/Continue guard covers it
              const clamped = Math.max(hoseQuantityMin, Math.min(hoseQuantityMax, n));
              setQuantityInput(String(clamped));
              // Live-pricing sync — quantity settled into a valid value.
              if (clamped >= hoseQuantityMin && clamped <= hoseQuantityMax) {
                syncContextIfValid(lengths.length === clamped ? lengths : lengths.slice(0, clamped));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
                setTimeout(() => {
                  const el = document.getElementById('cutLengthInput-0') as HTMLInputElement | null;
                  if (el && quantityValid) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.focus();
                  }
                }, 50);
              }
            }}
            className="px-4 py-3 rounded-full text-center text-base font-medium border-none outline-none"
            style={{ width: 120, background: 'rgba(255,255,255,0.8)', color: COLORS.grey.dark }}
          />
          {!quantityValid && quantityInput !== '' && (
            <p className="mt-2 text-xs" style={{ color: COLORS.error }}>
              Enter a number between {hoseQuantityMin} and {hoseQuantityMax}.
            </p>
          )}
        </div>

        <div className="space-y-4 mb-8">
          {lengths.map((len, idx) => (
            <div key={idx} className="flex flex-col items-center" style={{ ...GLASS_BASE, borderRadius: 16, padding: 16 }}>
              <label className="block text-xs font-semibold mb-1 text-center" style={{ color: COLORS.grey.medium }}>
                Hose {idx + 1} cut length (mm, min {cutLengthMinMm}mm)
              </label>
              <input
                id={`cutLengthInput-${idx}`}
                type="number"
                min={cutLengthMinMm}
                value={len}
                onChange={(e) => {
                  const next = [...lengths];
                  next[idx] = e.target.value;
                  setLengths(next);
                  // Live pricing: push to context on every keystroke once all
                  // fields are valid (no blur/Enter needed).
                  syncContextIfValid(next);
                }}
                onBlur={() => handleLengthBlur(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="px-4 py-2 rounded-full text-center text-base font-medium border-none outline-none"
                style={{ width: 230, background: 'rgba(255,255,255,0.8)', color: COLORS.grey.dark }}
                placeholder={`e.g. ${cutLengthMinMm}`}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center mb-12">
          <ContinueButton onClick={handleContinue} disabled={!isValid || isPricing} text={isPricing ? 'Pricing…' : 'Continue'} />
        </div>
      </div>
    </Hose360Layout>
  );
}

export default function CutLengths() {
  return <Hose360OptionsGate>{(options) => <CutLengthsInner options={options} />}</Hose360OptionsGate>;
}
