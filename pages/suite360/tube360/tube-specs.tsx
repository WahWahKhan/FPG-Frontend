/**
 * TUBE360 Tube Details Page - Step 2 (shared by both methods)
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
import { GlassSelect, GlassNumberInput, PagePill, RequiredNote, FieldHint } from '../../../components/Tube360/Fields';
import { useTube360 } from '../../../context/Tube360Context';
import {
  getEntry,
  odOptionsFor,
  wallOptionsFor,
  isSpecValid,
  validateTotalLength,
  validateQuantity,
} from '../../../utils/tube360/validation';
import type { Tube360Options } from '../../../types/tube360';

function TubeSpecsInner({ options }: { options: Tube360Options }) {
  const router = useRouter();
  const { config, updateSpec, updateBends } = useTube360();
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!config.method) {
      router.replace('/suite360/tube360/method');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.method]);

  const spec = config.spec;
  const entry = getEntry(options, spec.catalogId);
  const odOptions = odOptionsFor(options, spec.material, spec.sizeSystem);
  const walls = wallOptionsFor(options, spec.material, spec.sizeSystem, spec.odLabel);

  const setTouchedField = (id: string) => setTouched((prev) => ({ ...prev, [id]: true }));

  const handleMaterialChange = (value: string) => {
    updateSpec({ material: value as any, odLabel: null, catalogId: null });
  };
  const handleSizeSystemChange = (value: string) => {
    updateSpec({ sizeSystem: value as any, odLabel: null, catalogId: null });
  };
  const handleOdChange = (value: string) => {
    const newWalls = wallOptionsFor(options, spec.material, spec.sizeSystem, value);
    updateSpec({ odLabel: value, catalogId: newWalls.length === 1 ? newWalls[0].id : null });
  };
  const handleCatalogChange = (value: string) => {
    const newEntry = options.tubes.find((t) => t.id === value) || null;
    const patch: any = { catalogId: value };
    if (newEntry) {
      if (spec.endA && !newEntry.allowedEnds.includes(spec.endA)) patch.endA = null;
      if (spec.endB && !newEntry.allowedEnds.includes(spec.endB)) patch.endB = null;
    }
    updateSpec(patch);
    updateBends({ radiusMm: '' });
  };

  const shownError = (id: string, value: string, validate: () => string) =>
    value !== '' || touched[id] ? validate() : '';

  const totalLengthError = shownError('totalLengthMm', spec.totalLengthMm, () => validateTotalLength(spec.totalLengthMm, options));
  const quantityError = shownError('quantity', spec.quantity, () => validateQuantity(spec.quantity, options));

  const isValid = isSpecValid(config, options);

  const handleContinue = () => {
    if (!isValid) return;
    router.push(config.method === 'manual' ? '/suite360/tube360/bends' : '/suite360/tube360/upload');
  };

  const handleBack = () => router.push('/suite360/tube360/method');

  return (
    <Tube360Layout currentStep={2}>
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

        <PagePill>TUBE DETAILS</PagePill>

        <div className="space-y-5">
          <GlassSelect
            id="material"
            label="Material"
            required
            value={spec.material}
            placeholder="Select Material"
            options={options.materials.map((m) => ({ value: m.id, label: m.label }))}
            onChange={handleMaterialChange}
          />

          <GlassSelect
            id="sizeSystem"
            label="Tube Size"
            required
            value={spec.sizeSystem}
            placeholder="Select Imperial or Metric"
            options={options.sizeSystems.map((s) => ({ value: s.id, label: s.label }))}
            onChange={handleSizeSystemChange}
          />

          <GlassSelect
            id="odLabel"
            label="Outer Diameter"
            required
            value={spec.odLabel}
            placeholder="Select Outer Diameter"
            options={odOptions.map((od) => ({ value: od, label: od }))}
            onChange={handleOdChange}
            disabled={!spec.material || !spec.sizeSystem}
          />

          <div>
            <GlassSelect
              id="catalogId"
              label="Wall Thickness"
              required
              value={spec.catalogId}
              placeholder="Select Wall Thickness"
              options={walls.map((t) => ({ value: t.id, label: `${t.wallMm} mm` }))}
              onChange={handleCatalogChange}
              disabled={!spec.odLabel}
            />
            {entry && config.method === 'manual' && (
              <FieldHint>
                Bend radius for this size: {entry.minClrMm} mm (fixed, 2&times; outer diameter)
              </FieldHint>
            )}
          </div>

          <GlassSelect
            id="endA"
            label="End A"
            required
            value={spec.endA}
            placeholder="Select End A"
            options={options.endTypes.map((e) => ({
              value: e.id,
              label: e.id === 'none' ? e.label : `${e.label} - ${e.description}${entry && !entry.allowedEnds.includes(e.id) ? ' (not available for this size)' : ''}`,
              disabled: Boolean(entry && !entry.allowedEnds.includes(e.id)),
            }))}
            onChange={(value) => updateSpec({ endA: value as any })}
            disabled={!spec.catalogId}
          />

          <GlassSelect
            id="endB"
            label="End B"
            required
            value={spec.endB}
            placeholder="Select End B"
            options={options.endTypes.map((e) => ({
              value: e.id,
              label: e.id === 'none' ? e.label : `${e.label} - ${e.description}${entry && !entry.allowedEnds.includes(e.id) ? ' (not available for this size)' : ''}`,
              disabled: Boolean(entry && !entry.allowedEnds.includes(e.id)),
            }))}
            onChange={(value) => updateSpec({ endB: value as any })}
            disabled={!spec.catalogId}
          />

          <div>
            <GlassNumberInput
              id="totalLengthMm"
              label="Total Length"
              required
              value={spec.totalLengthMm}
              onChange={(value) => updateSpec({ totalLengthMm: value })}
              onBlur={() => setTouchedField('totalLengthMm')}
              unit="mm"
              placeholder="e.g. 1500"
              error={totalLengthError}
              hint={`Maximum ${options.machine.maxTotalLengthMm} mm (one full length of tube)`}
            />
            <FreightNotice options={options} totalLengthMm={spec.totalLengthMm} />
          </div>

          <GlassNumberInput
            id="quantity"
            label="Quantity"
            required
            value={spec.quantity}
            onChange={(value) => updateSpec({ quantity: value })}
            onBlur={() => setTouchedField('quantity')}
            unit="tubes"
            maxLength={3}
            error={quantityError}
            hint="Number of identical tubes"
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

export default function TubeSpecs() {
  return (
    <>
      <Head>
        <title>Tube360 | FluidPower Group</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <OptionsGate>{(options) => <TubeSpecsInner options={options} />}</OptionsGate>
    </>
  );
}
