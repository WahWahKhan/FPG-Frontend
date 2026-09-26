/**
 * HOSE360 Step 4 — End 1 SAE Code 62 fitting shape+size picker
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Hose360Layout from '../../../components/Hose360/Layout/Hose360Layout';
import { useHose360 } from '../../../context/Hose360Context';
import Hose360OptionsGate from '../../../components/Hose360/Layout/Hose360OptionsGate';
import SAEFittingPicker from '../../../components/Hose360/Shared/SAEFittingPicker';
import type { Hose360Options } from '../../../types/hose360';

function End1Sae62Inner({ options }: { options: Hose360Options }) {
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
      <SAEFittingPicker
        code="Code 62"
        codeData={options.saeFittings.codes[1]}
        sizes={options.saeFittings.sizes}
        end={1}
        onPicked={(shape, size, price) => {
          setEnd1Fitting(shape, size, price, 'end1-sae-62');
          router.push('/suite360/hose360/end2-fitting');
        }}
              onBackRoute={() => router.push('/suite360/hose360/end1-fitting')}
      />
    </Hose360Layout>
  );
}

export default function End1Sae62() {
  return <Hose360OptionsGate>{(options) => <End1Sae62Inner options={options} />}</Hose360OptionsGate>;
}
