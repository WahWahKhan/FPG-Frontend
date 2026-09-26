/**
 * HOSE360 Step 5 — End 2 Fitting type chooser. Same SAE-eligibility rule as
 * end1-fitting.tsx, keyed off the same config.selectedHose.size (the
 * original hose size, not anything end1-derived — confirmed identical rule
 * both ends per 02_FRONTEND_PLAN.md Step F6 row 5).
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Hose360Layout from '../../../components/Hose360/Layout/Hose360Layout';
import FittingsReminder from '../../../components/Hose360/Shared/FittingsReminder';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useHose360 } from '../../../context/Hose360Context';
import Hose360OptionsGate from '../../../components/Hose360/Layout/Hose360OptionsGate';
import FittingTypeChooser from '../../../components/Hose360/Shared/FittingTypeChooser';
import type { Hose360Options } from '../../../types/hose360';

function End2FittingInner({ options }: { options: Hose360Options }) {
  const router = useRouter();
  const { config } = useHose360();

  useEffect(() => {
    if (!config.selectedHose || !config.end1Shape || !config.end1Size) {
      router.replace('/suite360/hose360');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.selectedHose, config.end1Shape, config.end1Size]);

  if (!config.selectedHose || !config.end1Shape) return null;

  return (
    <Hose360Layout currentStep={5} totalSteps={11} showPriceBar={false}>
      <FittingsReminder />
      {/* Round 3.5 fix: this used to be a bare <BackButton /> (falls through
          to router.back()). That's unsafe here — FittingFamilyPicker's own
          in-place Back does a router.push() to get back to THIS page, which
          truncates/mutates the history stack, so a plain router.back() from
          here ping-pongs between this page and the end1-* page forever
          instead of ever reaching end1-fitting/hose-selection. Push an
          explicit, deterministic destination instead, using the route
          config.end1Route recorded when the user picked their end1 fitting. */}
      <BackButton onClick={() => router.push(`/suite360/hose360/${config.end1Route || 'end1-fitting'}`)} />
      <FittingTypeChooser
        options={options}
        hoseSize={config.selectedHose.size}
        end={2}
        onPick={(route) => router.push(`/suite360/hose360/${route}`)}
      />
    </Hose360Layout>
  );
}

export default function End2Fitting() {
  return <Hose360OptionsGate>{(options) => <End2FittingInner options={options} />}</Hose360OptionsGate>;
}
