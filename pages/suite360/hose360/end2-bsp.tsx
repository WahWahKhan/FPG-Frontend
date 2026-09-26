/**
 * HOSE360 Step 6 — End 2 BSP fitting shape+size picker.
 * Applies the corrected Orientation gate (DECISIONS.md §3): route to
 * orientation UNLESS either end is a Straight shape.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Hose360Layout from '../../../components/Hose360/Layout/Hose360Layout';
import FittingsReminder from '../../../components/Hose360/Shared/FittingsReminder';
import { useHose360 } from '../../../context/Hose360Context';
import Hose360OptionsGate from '../../../components/Hose360/Layout/Hose360OptionsGate';
import FittingFamilyPicker from '../../../components/Hose360/Shared/FittingFamilyPicker';
import { isStraightFittingAnyFamily } from '../../../utils/hose360/isStraightFitting';
import type { Hose360Options } from '../../../types/hose360';

function End2BspInner({ options }: { options: Hose360Options }) {
  const router = useRouter();
  const { config, setEnd2Fitting } = useHose360();

  useEffect(() => {
    if (!config.selectedHose || !config.end1Shape || !config.end1Size) {
      router.replace('/suite360/hose360');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.selectedHose, config.end1Shape, config.end1Size]);

  if (!config.selectedHose || !config.end1Shape) return null;

  return (
    <Hose360Layout currentStep={6} totalSteps={11} showPriceBar={false}>
      <FittingsReminder />
      <FittingFamilyPicker
        familyData={options.fittingFamilies.bsp}
        hoseSize={config.selectedHose.size}
        end={2}
        end1Shape={config.end1Shape}
        onPicked={(shape, size, price) => {
          setEnd2Fitting(shape, size, price, 'end2-bsp');
          const end1Straight = isStraightFittingAnyFamily(config.end1Shape);
          const end2Straight = isStraightFittingAnyFamily(shape);
          router.push(
            end1Straight || end2Straight
              ? '/suite360/hose360/cut-lengths'
              : '/suite360/hose360/orientation'
          );
        }}
              onBackRoute={() => router.push('/suite360/hose360/end2-fitting')}
      />
    </Hose360Layout>
  );
}

export default function End2Bsp() {
  return <Hose360OptionsGate>{(options) => <End2BspInner options={options} />}</Hose360OptionsGate>;
}
