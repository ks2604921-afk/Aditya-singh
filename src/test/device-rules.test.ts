import { createElement } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/lib/auth';
import DesktopLogin from '@/nova/components/DesktopLogin';
import PremiumGuestPoster from '@/nova/components/PremiumGuestPoster';
import TvLogin, { OTP_BUFFER_MS } from '@/nova/components/TvLogin';
import ProfileOnboarding from '@/nova/components/ProfileOnboarding';
import Profile from '@/nova/pages/Profile';
import { isOldNovaUser, registerNovaPhone } from '@/nova/user-account';
import { detectCurrentDevice, isDesktopDevice, shouldShowKeypad } from '@/nova/watching-profile-rules';

const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';
const PHONE = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36';
const TV = 'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K) AppleWebKit/537.36 Chrome/130 Safari/537.36 Android TV';

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
});

describe('keypad is TV-only', () => {
  it('shows on a TV', () => expect(shouldShowKeypad(TV)).toBe(true));
  it('hides on desktop', () => expect(shouldShowKeypad(DESKTOP)).toBe(false));
  it('hides on phone', () => expect(shouldShowKeypad(PHONE)).toBe(false));
});

describe('desktop detection for the Profile login box', () => {
  it('wide mouse-driven computer is desktop', () => expect(isDesktopDevice(DESKTOP, true, 1440)).toBe(true));
  it('phone is not desktop', () => expect(isDesktopDevice(PHONE, false, 412)).toBe(false));
  it('TV is not desktop', () => expect(isDesktopDevice(TV, true, 1920)).toBe(false));
  it('narrow window is not desktop', () => expect(isDesktopDevice(DESKTOP, true, 800)).toBe(false));
});

describe('real-time device detection in Profile Account view', () => {
  it('detects TV, desktop, and mobile browsers with optional model hints', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    expect(detectCurrentDevice().name).toBe('Sony BRAVIA TV');
    expect(detectCurrentDevice('KD-55X80L').name).toBe('KD-55X80L · Sony BRAVIA TV');

    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(DESKTOP);
    expect(detectCurrentDevice().name).toBe('Windows PC');
    expect(detectCurrentDevice().browser).toBe('Chrome');
  });

  it('fetches the live device automatically in Settings & Help without a refresh button, Live badge, or mobile Update button', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    render(
      createElement(
        AuthProvider,
        null,
        createElement(Profile, { bigScreen: true, settingsRequest: 1, onLogout: () => undefined }),
      ),
    );

    expect(screen.getByTestId('settings-side-panel')).toBeInTheDocument();
    expect(screen.getByTestId('current-device-name')).toHaveTextContent('Sony BRAVIA TV');
    expect(screen.getByTestId('current-device-meta')).toHaveTextContent('Last used : Today');
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    expect(screen.queryByText(/Our team is always here for you/i)).toBeNull();
    expect(screen.queryByText('Live')).toBeNull();
    expect(screen.queryByText(/Active now/i)).toBeNull();
    expect(screen.queryByText(/Privacy Policy/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /refresh/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Update/i })).toBeNull();

    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(DESKTOP);
    fireEvent(window, new Event('focus'));
    expect(screen.getByTestId('current-device-name')).toHaveTextContent('Windows PC');
  });

  it('returns straight to Account section on Back or choosing a plan from Upgrade without Manage Subscription', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    render(
      createElement(
        AuthProvider,
        null,
        createElement(Profile, { bigScreen: true, settingsRequest: 1, onLogout: () => undefined }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));
    expect(screen.getByRole('heading', { name: 'Upgrade Plan' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByText('Manage Subscription')).toBeNull();
    expect(screen.getByTestId('settings-side-panel')).toBeInTheDocument();
    expect(screen.getByTestId('this-device-card')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));
    fireEvent.click(screen.getByRole('button', { name: /Choose Premium/i }));
    expect(screen.queryByText('Manage Subscription')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Premium' })).toBeInTheDocument();
    expect(screen.getByTestId('settings-side-panel')).toBeInTheDocument();
  });

  it('renders DesktopLogin without QR scanner or removed headings and completes phone OTP login', () => {
    const onDone = vi.fn();
    render(createElement(DesktopLogin, { onDone }));

    expect(screen.queryByText(/Login or sign up to continue/i)).toBeNull();
    expect(screen.queryByText(/Scan QR code or enter phone number to login/i)).toBeNull();
    expect(screen.queryByText(/Use Camera App to Scan QR/i)).toBeNull();

    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));
    fireEvent.change(screen.getByLabelText('OTP'), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify & Continue/i }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('portals ProfileOnboarding language and welcome screens above SideRail and Navbar without ready tagline', () => {
    const { container } = render(
      createElement(ProfileOnboarding, { name: 'kkkk', onDone: () => undefined }),
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    const langDialog = screen.getByRole('dialog', { name: 'Profile preferences' });
    expect(langDialog.className).toContain('z-[210]');
    expect(langDialog.querySelectorAll('img').length).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Hindi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const welcomeDialog = screen.getByRole('dialog', { name: 'Profile preferences' });
    expect(welcomeDialog.className).toContain('z-[210]');
    expect(welcomeDialog.querySelectorAll('img').length).toBe(0);
    expect(screen.getByRole('heading', { name: 'Welcome to NOVA, kkkk!' })).toBeInTheDocument();
    expect(screen.queryByText(/Your entertainment universe is ready/i)).toBeNull();
  });

  it('opens Settings & Help directly on the Language section when requestedSetting is Language', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    render(
      createElement(
        AuthProvider,
        null,
        createElement(Profile, { bigScreen: true, settingsRequest: 1, requestedSetting: 'Language', onLogout: () => undefined }),
      ),
    );

    expect(screen.getByTestId('settings-side-panel')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tamil' })).toBeInTheDocument();
  });

  it('renders centered TvLogin screen with thicker highlighted buffering and completes OTP flow without Wrong OTP', () => {
    vi.useFakeTimers();
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    const onDone = vi.fn();
    render(createElement(TvLogin, { onDone }));

    const tvLoginRoot = screen.getByTestId('tv-login-screen');
    expect(tvLoginRoot).toBeInTheDocument();
    expect(tvLoginRoot.querySelectorAll('img').length).toBe(0);
    expect(screen.queryByText('Smart TV')).toBeNull();
    expect(screen.queryByText('Login on TV')).toBeNull();
    expect(screen.queryByText(/Use your TV remote keypad/i)).toBeNull();
    expect(screen.queryByText(/Remote & keyboard ready/i)).toBeNull();
    expect(OTP_BUFFER_MS).toBeLessThanOrEqual(2000);

    for (const digit of '8092123438') {
      fireEvent.click(screen.getByRole('button', { name: digit }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));

    const buffering = screen.getByTestId('tv-login-buffering');
    const spinner = screen.getByTestId('tv-login-spinner');
    expect(buffering).toBeInTheDocument();
    expect(buffering.className).toContain('bg-transparent');
    expect(buffering.className).not.toContain('bg-nova-black');
    expect(spinner.className).toContain('rounded-full');
    expect(spinner.className).toContain('bg-transparent');
    expect(spinner.className).toContain('border-[5px]');
    expect(spinner.className).toContain('border-t-[#ec4899]');

    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS - 100);
    });
    expect(screen.getByTestId('tv-login-buffering')).toBeInTheDocument();
    expect(screen.queryByTestId('tv-login-otp')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByTestId('tv-login-buffering')).toBeNull();
    expect(screen.getByTestId('tv-login-otp')).toBeInTheDocument();
    expect(screen.getByText(/OTP sent to your no/i)).toBeInTheDocument();
    const maskedEl = screen.getByText('8092xxxx38');
    expect(maskedEl).toBeInTheDocument();
    expect(maskedEl.className).toContain('text-white');
    expect(screen.queryByText(/Sample OTP/i)).toBeNull();
    expect(screen.queryByText(/Change number/i)).toBeNull();

    const editBtn = screen.getByRole('button', { name: 'Edit mobile number' });
    expect(editBtn).toHaveTextContent('Edit');
    expect(editBtn.className).not.toContain('rounded-full');

    fireEvent.click(editBtn);
    expect(screen.getByTestId('tv-login-phone')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });
    expect(screen.getByTestId('tv-login-otp')).toBeInTheDocument();

    for (const digit of '1234') {
      fireEvent.click(screen.getByRole('button', { name: digit }));
    }
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Verify & Continue/i }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onDone).toHaveBeenCalledWith('8092123438');

    cleanup();
    const onDoneKey = vi.fn();
    render(createElement(TvLogin, { onDone: onDoneKey }));
    for (const key of '9876543210') {
      fireEvent.keyDown(window, { key });
    }
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByTestId('tv-login-buffering')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });
    expect(screen.getByTestId('tv-login-otp')).toBeInTheDocument();
    expect(screen.getByText('9876xxxx10')).toBeInTheDocument();
    for (const key of '1234') {
      fireEvent.keyDown(window, { key });
    }
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onDoneKey).toHaveBeenCalledWith('9876543210');
  });

  it('distinguishes old user 8092153438 from new numbers and renders PremiumGuestPoster for new users', () => {
    localStorage.clear();
    expect(isOldNovaUser('8092153438')).toBe(true);
    expect(isOldNovaUser('9876543210')).toBe(false);

    const onContinueGuest = vi.fn();
    const onSelectPlan = vi.fn();
    const onSwitchAccount = vi.fn();
    render(
      createElement(PremiumGuestPoster, {
        phone: '9876543210',
        onContinueGuest,
        onSelectPlan,
        onSwitchAccount,
      }),
    );

    const posterScreen = screen.getByTestId('premium-guest-poster');
    expect(posterScreen).toBeInTheDocument();
    expect(posterScreen.querySelectorAll('img').length).toBe(0);
    expect(screen.getByText('+91 9876xxxx10')).toBeInTheDocument();
    expect(screen.getByText('NOVA Premium Guest Pass')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Super Premium/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue with Super Premium/i }));
    expect(onSelectPlan).toHaveBeenCalledWith('Super Premium');

    fireEvent.click(screen.getByRole('button', { name: 'Explore as Guest' }));
    expect(onContinueGuest).toHaveBeenCalledTimes(1);

    registerNovaPhone('9876543210');
    expect(isOldNovaUser('9876543210')).toBe(true);
  });
});
