/**
 * TRAC360 Setup Reminder Component
 * Floating visual reminder of selected valve setup
 * Shown on all pages from operation-type to mounting-brackets
 *
 * Draggable via plain pointer events on ONE shared element (expanded card and
 * minimised badge share a single position). Position is absolute viewport px,
 * clamped fully on-screen, persisted per session. (Replaces the framer-motion
 * drag version, whose relative offsets/stale animate props made it snap back,
 * re-expand on move, or vanish off-screen.)
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useTrac360 } from '../../../context/Trac360Context';
import { COLORS } from '../styles';

const POS_KEY = 'trac360-setup-reminder-pos-v2';
const MIN_KEY = 'trac360-setup-reminder-minimized';
const MARGIN = 8;

type Pos = { left: number; top: number };

export default function SetupReminder() {
  const { config } = useTrac360();
  const [isMinimized, setIsMinimized] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null); // null = default top-right
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);

  const clamp = useCallback((p: Pos): Pos => {
    const el = ref.current;
    const w = el?.offsetWidth ?? 48;
    const h = el?.offsetHeight ?? 48;
    return {
      left: Math.min(Math.max(MARGIN, p.left), Math.max(MARGIN, window.innerWidth - w - MARGIN)),
      top: Math.min(Math.max(MARGIN, p.top), Math.max(MARGIN, window.innerHeight - h - MARGIN)),
    };
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(POS_KEY);
      if (saved) setPos(JSON.parse(saved));
      if (sessionStorage.getItem(MIN_KEY) === 'true') setIsMinimized(true);
    } catch { /* defaults */ }
  }, []);

  useEffect(() => {
    const fix = () => setPos((p) => (p ? clamp(p) : p));
    fix();
    window.addEventListener('resize', fix);
    return () => window.removeEventListener('resize', fix);
  }, [clamp, isMinimized]);

  const persistMin = (v: boolean) => {
    setIsMinimized(v);
    try { sessionStorage.setItem(MIN_KEY, String(v)); } catch { /* ignore */ }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-nodrag]')) return;
    const rect = ref.current!.getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, sx: e.clientX, sy: e.clientY, moved: false };
    ref.current!.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
    d.moved = true;
    setPos(clamp({ left: e.clientX - d.dx, top: e.clientY - d.dy }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    try { ref.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    if (d.moved) {
      setPos((p) => {
        if (p) { try { sessionStorage.setItem(POS_KEY, JSON.stringify(p)); } catch { /* ignore */ } }
        return p;
      });
    } else if (isMinimized) {
      persistMin(false);
    }
  };

  const resetPosition = () => {
    setPos(null);
    try { sessionStorage.removeItem(POS_KEY); } catch { /* ignore */ }
  };

  // Don't show if no valve setup selected
  if (!config.valveSetup || !config.tractorInfo.protectionType) {
    return null;
  }

  const { code, name } = config.valveSetup;
  const protectionType = config.tractorInfo.protectionType;
  const placement: React.CSSProperties = pos ? { left: pos.left, top: pos.top } : { top: 160, right: 16 };
  const iconBtn = 'p-1 rounded hover:bg-gray-100 transition-colors';

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`fixed cursor-move select-none ${isMinimized ? '' : 'w-40 md:w-[250px]'}`}
      style={{
        ...placement,
        touchAction: 'none',
        zIndex: 45,
        ...(isMinimized
          ? {
              width: 48, height: 48, borderRadius: '50%', background: COLORS.yellow.primary,
              border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 15px rgba(250,204,21,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }
          : {
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
              border: `2px solid ${COLORS.yellow.primary}`, borderRadius: 16, boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            }),
      }}
    >
      {isMinimized ? (
        <span className="text-lg font-bold pointer-events-none" style={{ color: COLORS.grey.dark }}>{code}</span>
      ) : (
        <>
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(200,200,200,0.3)' }}>
            <span className="text-xs font-semibold" style={{ color: COLORS.grey.medium }}>Selected Setup</span>
            <div className="flex items-center gap-1" data-nodrag>
              {pos && (
                <button onClick={resetPosition} className={iconBtn} aria-label="Reset position" title="Reset to default position">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke={COLORS.grey.medium} strokeWidth="2" />
                    <path d="M12 8V12L15 15" stroke={COLORS.grey.medium} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              <button onClick={() => persistMin(true)} className={iconBtn} aria-label="Minimize setup reminder">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 15L12 9L6 15" stroke={COLORS.grey.medium} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-3">
            <div className="w-full aspect-video bg-gray-50 rounded-lg overflow-hidden mb-2">
              <Image
                src={`/trac360/${protectionType.toUpperCase()}_(${code}).gif`}
                alt={`Setup ${code}`}
                width={180}
                height={120}
                className="object-contain w-full h-full scale-90 md:scale-100 pointer-events-none"
                unoptimized
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: COLORS.yellow.primary, color: COLORS.grey.dark }}>
                {code}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: COLORS.grey.dark }}>Setup {code}</p>
                <p className="text-xs truncate" style={{ color: COLORS.grey.medium }}>{name}</p>
              </div>
            </div>
          </div>

          {!pos && (
            <div className="px-3 pb-2">
              <p className="text-[10px] text-center italic" style={{ color: COLORS.grey.medium }}>💡 Drag to reposition</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
