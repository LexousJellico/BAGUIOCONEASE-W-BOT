import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AlertError from './alert-error';

interface TwoFactorRecoveryCodesProps {
    recoveryCodesList: string[];
    fetchRecoveryCodes: () => Promise<void>;
    errors: string[];
}

export default function TwoFactorRecoveryCodes({
    recoveryCodesList,
    fetchRecoveryCodes,
    errors,
}: TwoFactorRecoveryCodesProps) {
    const [codesAreVisible, setCodesAreVisible] = useState(false);
    const [processing, setProcessing] = useState(false);
    const codesSectionRef = useRef<HTMLDivElement | null>(null);

    const canRegenerateCodes = recoveryCodesList.length > 0 && codesAreVisible;

    const toggleCodesVisibility = async () => {
        if (!codesAreVisible && !recoveryCodesList.length) {
            await fetchRecoveryCodes();
        }

        setCodesAreVisible((prev) => !prev);

        if (!codesAreVisible) {
            setTimeout(() => {
                codesSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            });
        }
    };

    const regenerateCodes = () => {
        setProcessing(true);

        router.post(
            '/user/two-factor-recovery-codes',
            {},
            {
                preserveScroll: true,
                onSuccess: async () => {
                    await fetchRecoveryCodes();
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    useEffect(() => {
        if (!recoveryCodesList.length) {
            fetchRecoveryCodes();
        }
    }, [recoveryCodesList.length, fetchRecoveryCodes]);

    const RecoveryCodeIconComponent = codesAreVisible ? EyeOff : Eye;

    return (
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-xl font-semibold">
                        2FA Recovery Codes
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        Recovery codes let you regain access if you lose your
                        2FA device. Store them in a secure password manager.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={toggleCodesVisibility}
                    >
                        <RecoveryCodeIconComponent className="mr-2 h-4 w-4" />
                        {codesAreVisible ? 'Hide' : 'View'} Recovery Codes
                    </Button>

                    {canRegenerateCodes && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={regenerateCodes}
                            disabled={processing}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Regenerate Codes
                        </Button>
                    )}
                </div>
            </div>

            <div ref={codesSectionRef} className="mt-5">
                {errors?.length ? (
                    <AlertError errors={errors} />
                ) : codesAreVisible ? (
                    <>
                        {recoveryCodesList.length ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {recoveryCodesList.map((code, index) => (
                                    <div
                                        key={`${code}-${index}`}
                                        className="rounded-2xl border border-black/10 bg-[#f7f5ef] px-4 py-3 font-mono text-sm dark:border-white/10 dark:bg-white/5"
                                    >
                                        {code}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {Array.from({ length: 8 }, (_, index) => (
                                    <div
                                        key={index}
                                        className="animate-pulse rounded-2xl border border-black/10 bg-[#f7f5ef] px-4 py-3 dark:border-white/10 dark:bg-white/5"
                                    >
                                        &nbsp;
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
                            Each recovery code can be used once to access your
                            account and will be removed after use.
                        </p>
                    </>
                ) : null}
            </div>
        </div>
    );
}
