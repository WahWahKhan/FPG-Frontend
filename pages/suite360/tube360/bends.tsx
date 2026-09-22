/**
 * TUBE360 Bends Page - Step 3 (manual method)
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';
import Tube360Layout from '../../../components/Tube360/Tube360Layout';
import OptionsGate from '../../../components/Tube360/OptionsGate';
import FreightNotice from '../../../components/Tube360/FreightNotice';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import { GlassNumberInput, GlassTextarea, PagePill, RequiredNote, NoticeBox } from '../../../components/Tube360/Fields';
import { useTube360 } from '../../../context/Tube360Context';
import {
  getEntry,
  buildLabels,
  isSpecValid,
  isBendsValid,
  validateTotalLength,
  validateBendCount,
  validateSection,
  validateAngle,
  resizeBendArrays,
  effectiveSections,
  sectionsSumStatus,
  toInt,
} from '../../../utils/tube360/validation';
import type { Tube360CatalogEntry, Tube360Options } from '../../../types/tube360';

function BendsInner({ options }: { options: Tube360Options }) {
  const router = useRouter();
  const { config, updateSpec, updateBends, setMethod } = useTube360();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // Suppresses the method guard below when WE are the ones changing the
  // method (e.g. switching to the upload flow) so it doesn't race our own
  // router.push and bounce the user to /method instead.
  const navigatingAwayRef = React.useRef(false);

  useEffect(() => {
    if (navigatingAwayRef.current) return;
    if (config.method !== 'manual') {
      router.replace('/suite360/tube360/method');
      return;
    }
    if (!isSpecValid(config, options)) {
      router.replace('/suite360/tube360/tube-specs');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.method]);

  const entry = getEntry(options, config.spec.catalogId) as Tube360CatalogEntry | null;
  const labels = entry ? buildLabels(config, options) : null;

  useEffect(() => {
    if (entry && config.bends.radiusMm === '') {
      updateBends({ radiusMm: String(entry.minClrMm) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id]);

  if (!entry || !labels) {
    return (
      <Tube360Layout currentStep={3}>
        <div className="flex items-center justify-center min-h-[400px]" />
      </Tube360Layout>
    );
  }

  const setTouchedField = (id: string) => setTouched((prev) => ({ ...prev, [id]: true }));
  const shownError = (id: string, value: string, validate: () => string) =>
    value !== '' || touched[id] ? validate() : '';

  const count = toInt(config.bends.count);
  const totalLengthError = shownError('totalLengthMm', config.spec.totalLengthMm, () => validateTotalLength(config.spec.totalLengthMm, options));
  const countError = shownError('count', config.bends.count, () => validateBendCount(config.bends.count, options));

  const handleCountChange = (value: string) => {
    updateBends({ count: value });
    const n = toInt(value);
    if (n !== null) {
      updateBends({ count: value, ...resizeBendArrays(config.bends, n) });
    }
  };

  const handleSectionChange = (index: number, value: string) => {
    const sections = [...config.bends.sectionsMm];
    sections[index] = value;
    updateBends({ sectionsMm: sections });
  };

  const handleAngleChange = (index: number, value: string) => {
    const angles = [...config.bends.anglesDeg];
    angles[index] = value;
    updateBends({ anglesDeg: angles });
  };

  const sections = effectiveSections(config);
  const sumStatus = sectionsSumStatus(sections, config.spec.totalLengthMm);

  const isValid = isBendsValid(config, options);
  const handleContinue = () => {
    if (!isValid) return;
    router.push('/suite360/tube360/summary');
  };
  const handleBack = () => router.push('/suite360/tube360/tube-specs');

  return (
    <Tube360Layout currentStep={3}>
      <BackButton onClick={handleBack} />
      <div className="max-w-2xl mx-auto px-2 sm:px-4">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative w-40 h-40 sm:w-60 sm:h-60">
            <Image
              src="/fluidpower_logo_transparent.gif"
              alt="Fluid Power Group"
              width={240}
              height={240}
              className="object-contain"
              unoptimized
            />
          </div>
        </div>

        <PagePill>BENDS</PagePill>

        {/* Spec summary chip */}
        <div
          className="rounded-2xl px-4 py-3 text-sm text-center mb-6 flex flex-wrap items-center justify-center gap-2"
          style={{ background: 'rgba(255,255,255,0.7)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
        >
          <span>
            {labels.material} &middot; {labels.od} &times; {labels.wallMm} mm &middot; End A: {labels.endA} &middot; End B: {labels.endB} &middot; Qty {config.spec.quantity}
          </span>
          <button
            type="button"
            className="text-xs font-semibold underline"
            style={{ color: '#a16207' }}
            onClick={() => router.push('/suite360/tube360/tube-specs')}
          >
            Edit
          </button>
        </div>

        <div className="mb-6">
          <NoticeBox title="Machine limits">
            <ul className="list-disc pl-5 space-y-1">
              <li>Bend angle: {options.machine.minBendAngleDeg}&deg; to {options.machine.maxBendAngleDeg}&deg; per bend (applies to all tubes).</li>
              <li>Bend radius: 2&times; outer diameter of the selected tube (fixed).</li>
              <li>Minimum straight section: {entry.minSectionMm} mm.</li>
              <li>All bends are formed in one plane.</li>
              <li>
                For tubes with bends in different directions (3D), please{' '}
                <button
                  type="button"
                  className="text-xs font-semibold underline"
                  style={{ color: '#a16207' }}
                  onClick={() => {
                    navigatingAwayRef.current = true;
                    setMethod('upload');
                    router.push('/suite360/tube360/upload');
                  }}
                >
                  upload your files/drawings instead
                </button>
                .
              </li>
            </ul>
          </NoticeBox>
        </div>

        <div className="space-y-5">
          <div>
            <GlassNumberInput
              id="totalLengthMm"
              label="Total Length"
              required
              value={config.spec.totalLengthMm}
              onChange={(value) => updateSpec({ totalLengthMm: value })}
              onBlur={() => setTouchedField('totalLengthMm')}
              unit="mm"
              hint={`Maximum ${options.machine.maxTotalLengthMm} mm`}
              error={totalLengthError}
            />
            <FreightNotice options={options} totalLengthMm={config.spec.totalLengthMm} />
          </div>

          <GlassNumberInput
            id="count"
            label="Number of Bends"
            required
            value={config.bends.count}
            onChange={handleCountChange}
            onBlur={() => setTouchedField('count')}
            unit="bends"
            maxLength={2}
            hint={`0 to ${options.machine.maxBends}. Use 0 for a straight cut tube.`}
            error={countError}
          />

          {/* Bend radius is still computed and stored (config.bends.radiusMm,
              auto-populated above from entry.minClrMm) for pricing/validation/
              manufacturing - the customer has already been told it's fixed at
              2x outer diameter (Machine Limits above), so displaying the
              specific number again here was redundant. Kept as a value, just
              not rendered. */}

          {count !== null && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-center" style={{ color: '#4a4a4a' }}>
                Section lengths and bend angles
              </h3>

              {count === 0 ? (
                <GlassNumberInput
                  id="section-1"
                  label="Section 1"
                  value={config.spec.totalLengthMm}
                  onChange={() => {}}
                  unit="mm"
                  readOnly
                  hint="A straight tube is one section."
                />
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: count + 1 }).map((_, i) => (
                    <React.Fragment key={i}>
                      <GlassNumberInput
                        id={`section-${i}`}
                        label={`Section ${i + 1}`}
                        required
                        value={config.bends.sectionsMm[i] ?? ''}
                        onChange={(value) => handleSectionChange(i, value)}
                        onBlur={() => setTouchedField(`section-${i}`)}
                        unit="mm"
                        error={shownError(`section-${i}`, config.bends.sectionsMm[i] ?? '', () => validateSection(config.bends.sectionsMm[i] ?? '', entry))}
                      />
                      {i < count && (
                        <div className="pl-6 sm:pl-10 border-l-4" style={{ borderColor: 'rgba(250, 204, 21, 0.6)' }}>
                          <GlassNumberInput
                            id={`angle-${i}`}
                            label={`Bend ${i + 1} angle`}
                            required
                            value={config.bends.anglesDeg[i] ?? ''}
                            onChange={(value) => handleAngleChange(i, value)}
                            onBlur={() => setTouchedField(`angle-${i}`)}
                            unit="°"
                            inputMode="decimal"
                            maxLength={5}
                            error={shownError(`angle-${i}`, config.bends.anglesDeg[i] ?? '', () => validateAngle(config.bends.anglesDeg[i] ?? '', options))}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              <p
                className="text-sm text-center mt-3 font-semibold"
                style={{ color: sumStatus.matches ? '#16a34a' : '#dc2626' }}
              >
                {sumStatus.matches ? `Sections add up to ${sumStatus.sum} mm ✓` : sumStatus.message}
              </p>
            </div>
          )}

          <GlassTextarea
            id="notes"
            label="Notes for our team (optional)"
            value={config.bends.notes}
            onChange={(value) => updateBends({ notes: value })}
            maxLength={options.machine.maxNotesLength}
            placeholder="Anything we should know? e.g. orientation of the bends, finish, deburring"
          />
        </div>

        <div className="flex flex-col items-center mt-8 space-y-3">
          <ContinueButton onClick={handleContinue} disabled={!isValid} />
          <RequiredNote />
        </div>
      </div>
    </Tube360Layout>
  );
}

export default function Bends() {
  return (
    <>
      <Head>
        <title>Tube360 | FluidPower Group</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <OptionsGate>{(options) => <BendsInner options={options} />}</OptionsGate>
    </>
  );
}
