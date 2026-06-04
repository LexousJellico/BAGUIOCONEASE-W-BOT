import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { confirmBcccAction } from '@/components/ui/bccc-confirm-dialog';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    KeyRound,
    MapPin,
    MonitorSmartphone,
    ShieldBan,
    ShieldCheck,
    Smartphone,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type LoginDevice = {
    id: number;
    device_name: string;
    browser: string;
    platform: string;
    ip_address?: string | null;
    location_label?: string | null;
    is_current: boolean;
    is_trusted: boolean;
    is_active: boolean;
    first_seen_at?: string | null;
    last_seen_at?: string | null;
    revoked_at?: string | null;
};

type SecuritySummary = {
    two_factor_policy?: string;
    active_devices?: number;
    current_device?: LoginDevice | null;
};

interface TwoFactorProps {
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
    loginDevices?: LoginDevice[];
    securitySummary?: SecuritySummary;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Account Preferences', href: '/settings/profile' },
    { title: 'Two-Factor Authentication', href: '/settings/two-factor' },
];

function formatDate(value?: string | null) {
    if (!value) {
        return 'Not recorded';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function SecurityStat({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: string | number;
    tone?: 'default' | 'success' | 'warning';
}) {
    return (
        <div
            className={cx(
                'rounded-2xl border p-4',
                tone === 'success'
                    ? 'border-emerald-500/18 bg-emerald-500/8 text-emerald-800 dark:text-emerald-200'
                    : tone === 'warning'
                      ? 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                      : 'border-slate-200/80 bg-white/70 text-slate-900 dark:border-white/10 dark:bg-white/[0.055] dark:text-white',
            )}
        >
            <p className="text-[10px] font-black tracking-[0.18em] text-current/60 uppercase">
                {label}
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
        </div>
    );
}

export default function TwoFactor({
    requiresConfirmation = false,
    twoFactorEnabled = false,
    loginDevices = [],
    securitySummary,
}: TwoFactorProps) {
    const {
        qrCodeSvg,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();

    const [showSetupModal, setShowSetupModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const activeDevices = useMemo(
        () => loginDevices.filter((device) => device.is_active),
        [loginDevices],
    );
    const revokedDevices = useMemo(
        () => loginDevices.filter((device) => !device.is_active),
        [loginDevices],
    );

    const enableTwoFactor = () => {
        setProcessing(true);

        router.post(
            '/user/two-factor-authentication',
            {},
            {
                preserveScroll: true,
                onSuccess: async () => {
                    await fetchSetupData();
                    setShowSetupModal(true);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const disableTwoFactor = async () => {
        const confirmed = await confirmBcccAction({
            title: 'Disable two-factor authentication?',
            message:
                'This removes the extra login verification from your account. Continue only if you are sure your account is safe.',
            confirmText: 'Disable 2FA',
            cancelText: 'Keep 2FA enabled',
            tone: 'danger',
        });

        if (!confirmed) {
            return;
        }

        setProcessing(true);

        router.delete('/user/two-factor-authentication', {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const removeDevice = async (device: LoginDevice) => {
        const confirmed = await confirmBcccAction({
            title: device.is_current
                ? 'Remove this current device?'
                : 'Remove logged-in device?',
            message: device.is_current
                ? 'Removing this device signs you out immediately and clears this session from the device list.'
                : `Remove ${device.device_name || 'this device'} from your logged-in devices? The stored session will be revoked when session storage is enabled.`,
            confirmText: device.is_current ? 'Remove and logout' : 'Remove device',
            cancelText: 'Keep device',
            tone: 'warning',
        });

        if (!confirmed) {
            return;
        }

        router.delete(`/settings/devices/${device.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Account Preferences & Two-Factor Authentication" />

            <SettingsLayout>
                <div className="space-y-6">
                    <section className="account-security-hero p-5 sm:p-6 lg:p-7">
                        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#d6b05c]/25 bg-[#d6b05c]/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-[#8a6320] uppercase dark:border-[#f4d894]/18 dark:bg-[#f4d894]/8 dark:text-[#f4d894]">
                                    <KeyRound className="h-3.5 w-3.5" />
                                    Account preferences
                                </div>

                                <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                                    Two-factor login, remembered sessions, and trusted devices
                                </h1>
                                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-white/62">
                                    {securitySummary?.two_factor_policy ||
                                        'When 2FA is enabled, every fresh login requires an authenticator verification. Remember me helps keep the account remembered, but device security is still visible here.'}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                                <SecurityStat
                                    label="2FA status"
                                    value={twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                    tone={twoFactorEnabled ? 'success' : 'warning'}
                                />
                                <SecurityStat
                                    label="Active devices"
                                    value={securitySummary?.active_devices ?? activeDevices.length}
                                />
                                <SecurityStat
                                    label="Current device"
                                    value={securitySummary?.current_device?.device_name || 'This session'}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                            <div className="flex items-start gap-4">
                                <div
                                    className={cx(
                                        'grid h-12 w-12 shrink-0 place-items-center rounded-2xl',
                                        twoFactorEnabled
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                                            : 'bg-slate-500/10 text-slate-500 dark:text-slate-300',
                                    )}
                                >
                                    {twoFactorEnabled ? (
                                        <ShieldCheck className="h-6 w-6" />
                                    ) : (
                                        <ShieldBan className="h-6 w-6" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase dark:text-white/34">
                                        Login verification
                                    </p>
                                    <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                                        Two-Factor Authentication
                                    </h2>
                                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                        The verification window is locked to every fresh login session. The system will not silently wait two hours before asking again after a new login.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-[1.5rem] border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5">
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
                                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                    {twoFactorEnabled ? (
                                        <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Protected on login
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
                                            <AlertTriangle className="h-4 w-4" />
                                            Setup recommended
                                        </span>
                                    )}
                                </div>

                                {twoFactorEnabled ? (
                                    <div className="mt-5 space-y-4">
                                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                                            Two-factor authentication is active. On every fresh login, the account is redirected to the 2FA challenge before reaching protected pages.
                                        </p>

                                        <div className="flex flex-wrap gap-3">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={disableTwoFactor}
                                                disabled={processing}
                                            >
                                                Disable 2FA
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={async () => {
                                                    await fetchSetupData();
                                                    setShowSetupModal(true);
                                                }}
                                            >
                                                View Setup
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-5 space-y-4">
                                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                                            Enable 2FA with a TOTP authenticator app so every login needs both your password and the secure verification code.
                                        </p>

                                        <Button type="button" onClick={enableTwoFactor} disabled={processing}>
                                            Enable 2FA
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                            <div className="flex items-start gap-4">
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0b2421]/10 text-[#176456] dark:bg-[#7dd7c6]/10 dark:text-[#7dd7c6]">
                                    <MonitorSmartphone className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase dark:text-white/34">
                                        Device activity
                                    </p>
                                    <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                                        Logged-in devices and locations
                                    </h2>
                                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                        The system records the browser, platform, approximate location headers, IP address, and last activity so users can remove sessions they no longer trust.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                {activeDevices.length > 0 ? (
                                    activeDevices.map((device) => (
                                        <article key={device.id} className="account-security-device-card p-4">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex min-w-0 gap-3">
                                                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white">
                                                        <Smartphone className="h-5 w-5" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="truncate text-sm font-black text-slate-950 dark:text-white">
                                                                {device.device_name || 'Unknown device'}
                                                            </h3>
                                                            {device.is_current ? (
                                                                <Badge variant="default">Current</Badge>
                                                            ) : null}
                                                            {device.is_trusted ? (
                                                                <Badge variant="secondary">Remembered</Badge>
                                                            ) : null}
                                                        </div>
                                                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-white/44">
                                                            {device.browser || 'Browser'} • {device.platform || 'Platform'} • {device.ip_address || 'IP unavailable'}
                                                        </p>
                                                        <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 dark:text-white/46">
                                                            <span className="inline-flex items-center gap-2">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                {device.location_label || 'Location unavailable'}
                                                            </span>
                                                            <span className="inline-flex items-center gap-2">
                                                                <Clock3 className="h-3.5 w-3.5" />
                                                                Last active: {formatDate(device.last_seen_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => void removeDevice(device)}
                                                    className="shrink-0"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {device.is_current ? 'Remove & logout' : 'Remove'}
                                                </Button>
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-white/14">
                                        <MonitorSmartphone className="mx-auto h-8 w-8 text-slate-400" />
                                        <p className="mt-3 text-sm font-bold text-slate-700 dark:text-white/70">
                                            No login devices have been recorded yet.
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-white/44">
                                            Devices appear here after the next successful login.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {revokedDevices.length > 0 ? (
                        <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                            <h2 className="text-lg font-black text-slate-950 dark:text-white">
                                Removed device history
                            </h2>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {revokedDevices.slice(0, 6).map((device) => (
                                    <div
                                        key={`revoked-${device.id}`}
                                        className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]"
                                    >
                                        <p className="font-bold text-slate-800 dark:text-white">
                                            {device.device_name || 'Removed device'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-white/44">
                                            Removed: {formatDate(device.revoked_at)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {twoFactorEnabled ? (
                        <TwoFactorRecoveryCodes
                            recoveryCodesList={recoveryCodesList}
                            fetchRecoveryCodes={fetchRecoveryCodes}
                            errors={errors}
                        />
                    ) : null}

                    <TwoFactorSetupModal
                        isOpen={showSetupModal}
                        onClose={() => setShowSetupModal(false)}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        clearSetupData={clearSetupData}
                        fetchSetupData={fetchSetupData}
                        errors={errors}
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
