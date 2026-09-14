/**
 * TUBE360 Contact Details Page - Step 4 (upload method)
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';
import Tube360Layout from '../../../components/Tube360/Tube360Layout';
import OptionsGate from '../../../components/Tube360/OptionsGate';
import QuoteContactForm from '../../../components/Tube360/QuoteContactForm';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { PagePill } from '../../../components/Tube360/Fields';
import { useTube360 } from '../../../context/Tube360Context';
import { buildLabels, buildQuoteSpec, getEntry, isSpecValid } from '../../../utils/tube360/validation';
import { submitTube360Quote } from '../../../lib/tube360/api';
import { COLORS } from '../../../components/Trac360/styles';
import type { ShippingDetails, ValidationErrors } from '../../../lib/checkout/form-validation';
import type { Tube360Options } from '../../../types/tube360';

function ContactDetailsInner({ options }: { options: Tube360Options }) {
  const router = useRouter();
  const { config, resetConfig } = useTube360();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors | undefined>();

  useEffect(() => {
    if (!isSpecValid(config, options) || config.upload.files.length < 1) {
      router.replace('/suite360/tube360/upload');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entry = getEntry(options, config.spec.catalogId);
  const labels = entry ? buildLabels(config, options) : null;

  const handleSubmit = async (details: ShippingDetails) => {
    setSubmitting(true);
    setError('');
    setFieldErrors(undefined);
    const spec = buildQuoteSpec(config, options);
    if (!spec) {
      router.replace('/suite360/tube360/tube-specs');
      return;
    }
    const result = await submitTube360Quote({
      contact: details,
      spec,
      files: config.upload.files.map(({ uploadId, name }) => ({ uploadId, name })),
      notes: config.upload.notes,
    });
    if (!result.ok) {
      setError(result.error || 'Something went wrong');
      setFieldErrors(result.fieldErrors);
      setSubmitting(false);
      return;
    }
    sessionStorage.setItem(
      'tube360-quote-result',
      JSON.stringify({ ref: result.ref, email: details.email, name: details.name, customerEmailed: result.customerEmailed })
    );
    router.push('/suite360/tube360/quote-submitted');
  };

  const handleBack = () => router.push('/suite360/tube360/upload');

  return (
    <Tube360Layout currentStep={4}>
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

        <PagePill>YOUR DETAILS</PagePill>

        {labels && (
          <div
            className="rounded-2xl px-4 py-3 text-sm text-center mb-6"
            style={{ background: 'rgba(255,255,255,0.7)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
          >
            Files: {config.upload.files.length} &middot; {labels.material} {labels.od} &times; {labels.wallMm} mm &middot; {config.spec.totalLengthMm} mm &middot; Qty {config.spec.quantity}
          </div>
        )}

        <QuoteContactForm onSubmit={handleSubmit} submitting={submitting} serverError={error} serverFieldErrors={fieldErrors} />

        <p className="text-sm text-center mb-8" style={{ color: COLORS.grey.medium }}>
          No payment is required. We&apos;ll email your quote to the address above, usually within 1 business day.
        </p>
      </div>
    </Tube360Layout>
  );
}

export default function ContactDetails() {
  return (
    <>
      <Head>
        <title>Tube360 | FluidPower Group</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <OptionsGate>{(options) => <ContactDetailsInner options={options} />}</OptionsGate>
    </>
  );
}
