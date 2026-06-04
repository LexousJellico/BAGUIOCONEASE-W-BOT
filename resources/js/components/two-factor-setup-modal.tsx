import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { useClipboard } from '@/hooks/use-clipboard';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { router } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Check, Copy, Loader2, ScanLine } from 'lucide-react';
import {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import AlertError from './alert-error';

function TwoFactorSetupStep({
    qrCodeSvg,
    manualSetupKey,
    buttonText,
    onNextStep,
    errors,
}: {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    buttonText: string;
    onNextStep: () => void;
    errors: string[];
}) {
    const [copiedText, copy] = useClipboard();
    const IconComponent = copiedText === manualSetupKey ? Check : Copy;

    return (
        <>
            {errors?.length ? (
                <AlertError errors={errors} />
            ) : (
                <div className="space-y-5">
                    <div className="rounded-[2rem] border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                            <ScanLine className="h-4 w-4" />
                            Scan QR Code
                        </div>

                        {qrCodeSvg ? (
                            <div
                                className="flex justify-center rounded-2xl bg-white p-4"
                                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                            />
                        ) : (
                            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-black/10 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                                Loading QR code...
                            </div>
                        )}
                    </div>

                    <div className="rounded-[2rem] border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-2 text-sm font-semibold">
                            Or enter the code manually
                        </div>

                        {!manualSetupKey ? (
                            <div className="text-sm text-slate-500 dark:text-slate-300">
                                Loading setup key...
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#121318]">
                                <code className="text-sm break-all">
                                    {manualSetupKey}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => copy(manualSetupKey)}
                                    className="rounded-full border border-black/10 p-2 dark:border-white/10"
                                >
                                    <IconComponent className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <Button type="button" onClick={onNextStep}>
                            {buttonText}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}

function TwoFactorVerificationStep({
    onClose,
    onBack,
}: {
    onClose: () => void;
    onBack: () => void;
}) {
    const [code, setCode] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string>('');
    const pinInputContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setTimeout(() => {
            pinInputContainerRef.current?.querySelector('input')?.focus();
        }, 0);
    }, []);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setError('');

        router.post(
            '/user/confirmed-two-factor-authentication',
            { code },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                },
                onError: (errors) => {
                    const message =
                        typeof errors.code === 'string'
                            ? errors.code
                            : 'Failed to confirm two-factor authentication.';
                    setError(message);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <div ref={pinInputContainerRef} className="flex justify-center">
                <InputOTP
                    maxLength={OTP_MAX_LENGTH}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={code}
                    onChange={setCode}
                >
                    <InputOTPGroup>
                        {Array.from({ length: OTP_MAX_LENGTH }, (_, index) => (
                            <InputOTPSlot key={index} index={index} />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
            </div>

            <InputError message={error} className="text-center" />

            <div className="flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={onBack}>
                    Back
                </Button>

                <Button
                    type="submit"
                    disabled={processing || code.length !== OTP_MAX_LENGTH}
                >
                    {processing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm
                </Button>
            </div>
        </form>
    );
}

interface TwoFactorSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    requiresConfirmation: boolean;
    twoFactorEnabled: boolean;
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    clearSetupData: () => void;
    fetchSetupData: () => Promise<void>;
    errors: string[];
}

export default function TwoFactorSetupModal({
    isOpen,
    onClose,
    requiresConfirmation,
    twoFactorEnabled,
    qrCodeSvg,
    manualSetupKey,
    clearSetupData,
    fetchSetupData,
    errors,
}: TwoFactorSetupModalProps) {
    const [showVerificationStep, setShowVerificationStep] = useState(false);

    const modalConfig = useMemo(() => {
        if (twoFactorEnabled) {
            return {
                title: 'Two-Factor Authentication Enabled',
                description: 'Two-factor authentication is now enabled.',
                buttonText: 'Close',
            };
        }

        if (showVerificationStep) {
            return {
                title: 'Verify Authentication Code',
                description:
                    'Enter the 6-digit code from your authenticator app.',
                buttonText: 'Continue',
            };
        }

        return {
            title: 'Enable Two-Factor Authentication',
            description:
                'To finish enabling two-factor authentication, scan the QR code or enter the setup key in your authenticator app.',
            buttonText: 'Continue',
        };
    }, [twoFactorEnabled, showVerificationStep]);

    const handleModalNextStep = useCallback(() => {
        if (requiresConfirmation) {
            setShowVerificationStep(true);
            return;
        }

        clearSetupData();
        onClose();
    }, [requiresConfirmation, clearSetupData, onClose]);

    const resetModalState = useCallback(() => {
        setShowVerificationStep(false);

        if (twoFactorEnabled) {
            clearSetupData();
        }
    }, [twoFactorEnabled, clearSetupData]);

    useEffect(() => {
        if (!isOpen) {
            resetModalState();
            return;
        }

        if (!qrCodeSvg) {
            fetchSetupData();
        }
    }, [isOpen, qrCodeSvg, fetchSetupData, resetModalState]);

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{modalConfig.title}</DialogTitle>
                    <DialogDescription>
                        {modalConfig.description}
                    </DialogDescription>
                </DialogHeader>

                {showVerificationStep ? (
                    <TwoFactorVerificationStep
                        onClose={() => {
                            clearSetupData();
                            onClose();
                        }}
                        onBack={() => setShowVerificationStep(false)}
                    />
                ) : (
                    <TwoFactorSetupStep
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        buttonText={modalConfig.buttonText}
                        onNextStep={handleModalNextStep}
                        errors={errors}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
