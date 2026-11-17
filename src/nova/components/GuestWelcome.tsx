import { useEffect, useState } from 'react';
import Logo from '@/nova/components/Logo';

type GuestWelcomeProps = { onExplore: () => void; onLogin: () => void };

export default function GuestWelcome({ onExplore, onLogin }: GuestWelcomeProps) {
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);

  return (
    <div role="dialog" aria-label="Welcome to NOVA" className="fixed inset-0 z-[140] overflow-hidden bg-nova-black">
      <style>{`@keyframes novaSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes novaFade{from{opacity:0}to{opacity:1}}`}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.28),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 via-45% to-black/20" />

      <div className="relative mx-auto flex h-full max-w-md flex-col px-6 pb-8 pt-6">
        <div className="mt-auto">
          <div className="mb-3 flex flex-col items-start">
            <Logo size="sm" />
            <span className="mt-1.5 bg-gradient-to-r from-[#a855f7] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-[clamp(1.2rem,5.6vw,1.45rem)] font-extrabold leading-[1.12] tracking-tight text-transparent drop-shadow-[0_0_14px_rgba(139,92,246,0.5)]">
              Welcome in your universe of entertainment
            </span>
          </div>
          <p className="mt-2 text-left text-xs leading-relaxed text-white/90">
            By proceeding you confirm that you are above 18 years of age and agree to the{' '}
            <span className="font-bold text-white underline decoration-white/60 underline-offset-[3px]">Privacy Policy</span>{' '}&amp;{' '}
            <span className="font-bold text-white underline decoration-white/60 underline-offset-[3px]">Terms of Use</span>.
          </p>
          <button
            onClick={() => setSheet(true)}
            className="mt-6 flex h-[60px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a130df] via-[#7e2af8] to-[#2f1668] text-lg font-bold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.7)] active:scale-[0.98]"
          >
            Continue
          </button>
        </div>
      </div>

      {sheet && (
        <div className="absolute inset-0 z-10 flex items-end justify-center">
          <button
            aria-label="Close"
            onClick={() => setSheet(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            style={{ animation: 'novaFade .25s ease-out' }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nova-login-sheet-title"
            className="relative w-full max-w-md rounded-t-[28px] border-t border-white/10 bg-nova-dark px-6 pb-8 pt-3 shadow-[0_-20px_60px_-10px_rgba(124,58,237,0.35)]"
            style={{ animation: 'novaSheetUp .35s cubic-bezier(.22,1,.36,1)' }}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="mb-3 flex justify-center">
              <Logo size="sm" />
            </div>
            <h2 id="nova-login-sheet-title" className="text-center text-2xl font-extrabold tracking-tight text-white">
              Login to enjoy
            </h2>
            <p className="mt-1.5 bg-gradient-to-r from-[#a855f7] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-center text-xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_12px_rgba(139,92,246,0.45)]">
              universe of entertainment
            </p>
            <button
              onClick={onLogin}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-[#a130df] via-[#7e2af8] to-[#2f1668] py-4 text-lg font-bold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.7)] active:scale-[0.98]"
            >
              Login
            </button>
            <button
              onClick={onExplore}
              className="mt-3 w-full rounded-full border border-white/20 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/[0.06] active:scale-[0.98]"
            >
              Let's explore
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
