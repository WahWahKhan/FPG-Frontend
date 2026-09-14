/**
 * TUBE360 Upload Page - Step 3 (upload method)
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';
import Tube360Layout from '../../../components/Tube360/Tube360Layout';
import OptionsGate from '../../../components/Tube360/OptionsGate';
import FileUploader from '../../../components/Tube360/FileUploader';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import { GlassTextarea, PagePill, RequiredNote, NoticeBox } from '../../../components/Tube360/Fields';
import { useTube360 } from '../../../context/Tube360Context';
import { buildLabels, getEntry, isSpecValid } from '../../../utils/tube360/validation';
import { COLORS } from '../../../components/Trac360/styles';
import type { Tube360Options, Tube360UploadedFile } from '../../../types/tube360';

function UploadInner({ options }: { options: Tube360Options }) {
  const router = useRouter();
  const { config, setUploadFiles, updateUploadNotes } = useTube360();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (config.method !== 'upload') {
      router.replace('/suite360/tube360/method');
      return;
    }
    if (!isSpecValid(config, options)) {
      router.replace('/suite360/tube360/tube-specs');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.method]);

  const entry = getEntry(options, config.spec.catalogId);
  const labels = entry ? buildLabels(config, options) : null;

  const handleContinue = () => {
    if (config.upload.files.length < 1 || busy) return;
    router.push('/suite360/tube360/contact-details');
  };
  const handleBack = () => router.push('/suite360/tube360/tube-specs');

  const handleFilesChange = (files: Tube360UploadedFile[]) => setUploadFiles(files);

  const maxMb = Math.round(options.uploads.maxFileSizeBytes / (1024 * 1024));

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

        <PagePill>UPLOAD YOUR DRAWING</PagePill>

        {labels && (
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
        )}

        <div className="space-y-5">
          <NoticeBox title="Supported file types">
            <div className="space-y-2">
              {options.uploads.groups.map((group) => {
                const extensions = options.uploads.fileTypes
                  .filter((t) => t.group === group.id)
                  .map((t) => `.${t.ext.toUpperCase()}`)
                  .join(', ');
                return (
                  <div key={group.id}>
                    <div>
                      <strong>{group.label}:</strong> {extensions}
                    </div>
                    {group.hint && <div style={{ color: COLORS.grey.medium }}>{group.hint}</div>}
                  </div>
                );
              })}
              <div>
                Up to {options.uploads.maxFiles} files, {maxMb} MB each. PDF drawings are welcome.
              </div>
            </div>
          </NoticeBox>

          <FileUploader options={options} files={config.upload.files} onChange={handleFilesChange} onBusyChange={setBusy} />

          <GlassTextarea
            id="upload-notes"
            label="Notes for our team (optional)"
            value={config.upload.notes}
            onChange={updateUploadNotes}
            maxLength={options.machine.maxNotesLength}
            placeholder="Anything we should know?"
          />

          <p className="text-sm text-center" style={{ color: COLORS.grey.medium }}>
            No payment is taken for uploaded drawings. Our team reviews your file and emails you a quote, usually within 1 business day.
          </p>
        </div>

        <div className="flex flex-col items-center mt-8 space-y-3">
          <ContinueButton onClick={handleContinue} disabled={config.upload.files.length < 1 || busy} />
          <RequiredNote />
          {config.upload.files.length < 1 && (
            <p className="text-sm" style={{ color: COLORS.grey.medium }}>
              Upload at least one file to continue
            </p>
          )}
        </div>
      </div>
    </Tube360Layout>
  );
}

export default function Upload() {
  return (
    <>
      <Head>
        <title>Tube360 | FluidPower Group</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <OptionsGate>{(options) => <UploadInner options={options} />}</OptionsGate>
    </>
  );
}
