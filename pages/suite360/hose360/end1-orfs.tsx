/**
 * HOSE360 Step 4 — End 1 ORFS fitting shape+size picker
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Hose360Layout from '../../../components/Hose360/Layout/Hose360Layout';
import { useHose360 } from '../../../context/Hose360Context';
import Hose360OptionsGate from '../../../components/Hose360/Layout/Hose360OptionsGate';
import FittingFamilyPicker from '../../../components/Hose360/Shared/FittingFamilyPicker';
import type { Hose360Options } from '../../../types/hose360';

function End1OrfsInner({ options }: { options: Hose360Options }) {
  const router = useRouter();
  const { config, setEnd1Fitting } = useHose360();

  useEffect(() => {
    if (!config.selectedHose) {
      router.replace('/suite360/hose360');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.selectedHose]);

  if (!config.selectedHose) return null;

  return (
    <Hose360Layout currentStep={4} totalSteps={11} showPriceBar={false}>
      <FittingFamilyPicker
        familyData={options.fittingFamilies.orfs}
        hoseSize={config.selectedHose.size}
        end={1}
        onPicked={(shape, size, price) => {
          setEnd1Fitting(shape, size, price, 'end1-orfs');
          router.push('/suite360/hose360/end2-fitting');
        }}
              onBackRoute={() => router.push('/suite360/hose360/end1-fitting')}
      />
    </Hose360Layout>
  );
}

export default function End1Orfs() {
  return <Hose360OptionsGate>{(options) => <End1OrfsInner options={options} />}</Hose360OptionsGate>;
}
