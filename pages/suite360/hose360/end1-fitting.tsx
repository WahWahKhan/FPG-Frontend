/**
 * HOSE360 Step 3 — End 1 Fitting type chooser
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Hose360Layout from '../../../components/Hose360/Layout/Hose360Layout';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useHose360 } from '../../../context/Hose360Context';
import Hose360OptionsGate from '../../../components/Hose360/Layout/Hose360OptionsGate';
import FittingTypeChooser from '../../../components/Hose360/Shared/FittingTypeChooser';
import type { Hose360Options } from '../../../types/hose360';

function End1FittingInner({ options }: { options: Hose360Options }) {
  const router = useRouter();
  const { config } = useHose360();

  useEffect(() => {
    if (!config.selectedHose) {
      router.replace('/suite360/hose360');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.selectedHose]);

  if (!config.selectedHose) return null;

  return (
    <Hose360Layout currentStep={3} totalSteps={11} showPriceBar={false}>
      <BackButton onClick={() => router.push('/suite360/hose360/hose-selection')} />
      <FittingTypeChooser
        options={options}
        hoseSize={config.selectedHose.size}
        end={1}
        onPick={(route) => router.push(`/suite360/hose360/${route}`)}
      />
    </Hose360Layout>
  );
}

export default function End1Fitting() {
  return <Hose360OptionsGate>{(options) => <End1FittingInner options={options} />}</Hose360OptionsGate>;
}
