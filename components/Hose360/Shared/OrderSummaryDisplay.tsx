/**
 * HOSE360 Order Summary display — read-only recap of the full configuration,
 * used inside the PDF-captured region of summary.tsx. Ported from the RN
 * app's OrderSummaryDisplay.js LabelItem/BorderedItem pattern as plain
 * HTML/CSS (no React Native View/Text components), per 02_FRONTEND_PLAN.md
 * Step F7.
 *
 * Round 3.8 (owner feedback): type enlarged for older/low-vision customers
 * (18px rows, 16px section headings, 30px total — was 12px rows/headings),
 * and the card is capped at 520px and centred so each label sits right next
 * to its value instead of being stretched across the whole page. Rows wrap
 * their value onto the next line rather than overflowing on phones.
 */

import React from 'react';
import { COLORS } from '../../Trac360/styles';
import type { Hose360Config } from '../../../types/hose360';

function LabelItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-2 text-lg leading-snug">
      <span className="flex-shrink-0" style={{ color: COLORS.grey.medium }}>{label}:</span>
      <span className="font-semibold text-right min-w-0 break-words" style={{ color: COLORS.grey.dark }}>
        {value}
      </span>
    </div>
  );
}

/** Bold subtotal row closing a section: label + amount. */
function SubtotalItem({ label, amount }: { label: string; amount: number | null | undefined }) {
  return (
    <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
      <div className="flex justify-between items-baseline gap-4 text-lg font-bold" style={{ color: COLORS.grey.dark }}>
        <span>{label}</span>
        <span>{formatPrice(amount)}</span>
      </div>
    </div>
  );
}

function formatPrice(price: number | null | undefined) {
  return `A$${(price ?? 0).toFixed(2)}`;
}

export default function OrderSummaryDisplay({ config }: { config: Hose360Config }) {
  const b = config.breakdown && config.breakdown.mode === 'assembly' ? config.breakdown : null;
  const qty: number = config.quantity || 1;
  const hoseUnit: number = b?.hoseUnit ?? 0; // A$ per metre
  const protectionAmt: number = b?.protection ?? 0;
  const pressureAmt: number = b?.pressureTest ?? 0;
  const showProtection = !!config.selectedProtection && config.selectedProtection !== 'NOT REQUIRED';
  const showPressure = !!config.selectedPressure && config.selectedPressure !== 'Not Required';
  return (
    <div
      className="rounded-2xl overflow-hidden w-full mx-auto"
      style={{
        maxWidth: 520,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(200, 200, 200, 0.3)',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-base font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.yellow.primary }}>
          Hose
        </h3>
        <LabelItem label="Size" value={config.selectedHose?.size ?? '—'} />
        <LabelItem label="Quantity" value={config.quantity} />
        {b && <LabelItem label="Price per metre" value={formatPrice(hoseUnit)} />}
      </div>

      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-base font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.yellow.primary }}>
          End 1 Fitting
        </h3>
        <LabelItem label="Shape" value={config.end1Shape ?? '—'} />
        <LabelItem label="Size" value={config.end1Size ?? '—'} />
        <LabelItem label="Price (each)" value={formatPrice(config.end1Price)} />
        {b && <SubtotalItem label="End 1 subtotal" amount={b.end1} />}
      </div>

      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-base font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.yellow.primary }}>
          End 2 Fitting
        </h3>
        <LabelItem label="Shape" value={config.end2Shape ?? '—'} />
        <LabelItem label="Size" value={config.end2Size ?? '—'} />
        <LabelItem label="Price (each)" value={formatPrice(config.end2Price)} />
        {b && <SubtotalItem label="End 2 subtotal" amount={b.end2} />}
      </div>

      {config.selectedAngle && (
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.yellow.primary }}>
            Orientation
          </h3>
          <LabelItem label="Angle" value={config.selectedAngle} />
        </div>
      )}

      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-base font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.yellow.primary }}>
          Cut Lengths
        </h3>
        {config.cutLengths.map((c, idx) => (
          <LabelItem
            key={idx}
            label={`Hose ${idx + 1}`}
            value={`${c.length}mm`}
          />
        ))}
        {b && <SubtotalItem label="Hose length subtotal" amount={b.baseHosePrice} />}
      </div>

      {showProtection && (
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-base font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.yellow.primary }}>
          Hose Protection
        </h3>
        <LabelItem label="Type" value={config.selectedProtection} />
        {b && <SubtotalItem label="Protection subtotal" amount={protectionAmt} />}
      </div>
      )}

      {showPressure && (
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-base font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.yellow.primary }}>
          Pressure Testing
        </h3>
        <LabelItem label="Pressure" value={config.selectedPressure} />
        {b && <SubtotalItem label="Pressure testing subtotal" amount={pressureAmt} />}
      </div>
      )}

      <div className="px-5 py-4 bg-gray-50">
        <h3 className="text-base font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.grey.dark }}>
          Price
        </h3>
        {b && (
          <div className="mb-3 text-base" style={{ color: COLORS.grey.medium }}>
            {[
              ['Hose length', b.baseHosePrice],
              ['End 1 fittings', b.end1],
              ['End 2 fittings', b.end2],
              ...(showProtection ? [['Hose protection', protectionAmt]] : []),
              ...(showPressure ? [['Pressure testing', pressureAmt]] : []),
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between py-0.5">
                <span>{l}</span>
                <span className="font-semibold" style={{ color: COLORS.grey.dark }}>{formatPrice(v as number)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="pt-3 border-t-2" style={{ borderColor: COLORS.yellow.primary }}>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold" style={{ color: COLORS.grey.dark }}>
              TOTAL:
            </span>
            <span className="text-3xl font-bold" style={{ color: COLORS.yellow.primary }}>
              {formatPrice(config.totalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
