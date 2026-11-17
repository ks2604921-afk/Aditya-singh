import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Pencil, X } from 'lucide-react';
import Logo from '@/nova/components/Logo';
import Keypad from '@/nova/components/Keypad';
import { SAMPLE_OTP } from '@/nova/components/SampleLogin';

/**
 * Centered login screen with keypad for NOVA.
 * Sample mode: any 10-digit number + OTP 1234 continues.
 */
export const OTP_BUFFER_MS = 1_500;

export default function TvLogin({ onDone }: { onDone: (phone?: string) => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  const sendTimerRef = useRef<number | null>(null);
  const stateRef = useRef({ step, phone, otp, sendingOtp, onDone });
  stateRef.current = { step, phone, otp, sendingOtp, onDone };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      if (sendTimerRef.current !== null) window.clearTimeout(sendTimerRef.current);
    };
  }, []);

  const value = step === 'phone' ? phone : otp;
  const len = step === 'phone' ? 10 : 4;

  const setValue = (next: string) => {
    if (stateRef.current.sendingOtp) return;
    const clean = next.replace(/\D/g, '').slice(0, len);
    setError('');
    if (step === 'phone') setPhone(clean);
    else setOtp(clean);
  };

  const sendOtp = () => {
    if (stateRef.current.sendingOtp) return;
    if (stateRef.current.phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setSendingOtp(true);
    if (sendTimerRef.current !== null) window.clearTimeout(sendTimerRef.current);
    sendTimerRef.current = window.setTimeout(() => {
      sendTimerRef.current = null;
      setSendingOtp(false);
      setOtp('');
      setStep('otp');
    }, OTP_BUFFER_MS);
  };

  const verify = () => {
    if (stateRef.current.otp !== SAMPLE_OTP) {
      setError(`Wrong OTP. Sample OTP is ${SAMPLE_OTP}`);
      setOtp('');
      return;
    }
    setError('');
    stateRef.current.onDone(stateRef.current.phone);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.getAttribute('data-tv-control') === 'secondary') return;
      const current = stateRef.current;
      if (current.sendingOtp) return;
      if (current.step === 'phone' && current.phone.length === 10) {
        e.preventDefault();
        sendOtp();
      } else if (current.step === 'otp' && current.otp.length === 4) {
        e.preventDefault();
        verify();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const formattedPhone = phone
    ? `${phone.slice(0, 5)}${phone.length > 5 ? ` ${phone.slice(5)}` : ''}`
    : '';
  const maskedPhone = phone.length >= 6 ? `${phone.slice(0, 4)}xxxx${phone.slice(-2)}` : phone;

  return (
    <div
      data-testid="tv-login-screen"
      className="fixed inset-0 z-[140] overflow-y-auto bg-nova-black text-white antialiased"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.22),transparent_60%)]" />

      <div className="relative flex min-h-full w-full flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="mb-6 flex justify-center">
          <Logo size="xl" />
        </div>

        <div
          role="dialog"
          aria-modal="true"
          aria-label="NOVA Login"
          className="w-full max-w-[400px] rounded-3xl border border-white/[0.12] bg-nova-dark/85 p-6 shadow-[0_28px_90px_-24px_rgba(124,58,237,0.42),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl sm:p-7"
        >
          {step === 'phone' ? (
            <>
              <p className="mb-4 text-center text-sm font-medium text-white">
                Sign in with your mobile number
              </p>
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.16] bg-black/45 px-4 py-3.5 transition focus-within:border-nova-accent/80">
                <span className="shrink-0 border-r border-white/20 pr-3 text-sm font-bold text-white">
                  +91
                </span>
                <div
                  aria-label="Mobile number"
                  data-testid="tv-login-phone"
                  className="min-w-0 flex-1 text-lg font-semibold tracking-widest text-white"
                >
                  {formattedPhone || <span className="text-sm font-normal tracking-normal text-white/80">Mobile number</span>}
                </div>
                {phone.length > 0 && (
                  <button
                    type="button"
                    data-tv-control="secondary"
                    aria-label="Clear number"
                    onClick={() => setValue('')}
                    className="rounded-full p-1 text-white transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-center text-sm text-white">
                <span>
                  OTP sent to your no <span className="tracking-wide text-white">{maskedPhone}</span>
                </span>
                <button
                  type="button"
                  data-tv-control="secondary"
                  aria-label="Edit mobile number"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                  }}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-white transition hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.85)]"
                >
                  <Pencil className="h-3.5 w-3.5 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]" />
                  <span>Edit</span>
                </button>
              </div>
              <div aria-label="OTP" data-testid="tv-login-otp" className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex h-13 items-center justify-center rounded-xl border bg-nova-black/75 text-xl font-bold transition ${
                      i === otp.length
                        ? 'border-nova-accent ring-1 ring-nova-accent/50 text-white'
                        : otp[i]
                          ? 'border-white/30 text-white'
                          : 'border-white/12 text-white'
                    }`}
                  >
                    {otp[i] ? '●' : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 text-center text-xs font-medium text-rose-400">
              {error}
            </p>
          )}

          <div className="mt-4">
            <Keypad
              value={value}
              length={len}
              onChange={setValue}
              hideDots
            />
          </div>

          <button
            type="button"
            disabled={value.length < len || sendingOtp}
            onClick={step === 'phone' ? sendOtp : verify}
            className="nova-pill-solid mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-[0_12px_32px_-8px_rgba(236,72,153,0.4)] transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
          >
            <span>{step === 'phone' ? 'Get OTP' : 'Verify & Continue'}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {sendingOtp && (
        <div
          data-testid="tv-login-buffering"
          role="status"
          aria-label="Sending OTP"
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent"
        >
          <div
            data-testid="tv-login-spinner"
            className="h-14 w-14 animate-spin rounded-full border-[5px] border-white/15 border-t-[#ec4899] border-r-[#7c3aed] bg-transparent drop-shadow-[0_0_16px_rgba(236,72,153,0.75)]"
          />
        </div>
      )}
    </div>
  );
}
