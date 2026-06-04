import { BcccLogoLoader } from '@/components/shared/bccc-logo-loader';
import { ShieldCheck } from 'lucide-react';

type BookingFormLoadingLayerProps = {
    visible: boolean;
    label?: string;
    sublabel?: string;
    fullscreen?: boolean;
};

export function BookingFormLoadingLayer({
    visible,
    label = 'Loading reservation form',
    sublabel = 'Please wait while the next booking section is prepared.',
    fullscreen = false,
}: BookingFormLoadingLayerProps) {
    if (!visible) {
        return null;
    }

    return (
        <div
            className={
                fullscreen
                    ? 'fixed inset-0 z-[999990] grid place-items-center bg-white/78 px-4 backdrop-blur-2xl dark:bg-slate-950/58'
                    : 'absolute inset-0 z-40 grid place-items-center rounded-[1.65rem] bg-white/78 px-4 backdrop-blur-2xl dark:bg-slate-950/58'
            }
        >
            <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-[#d9c7a6]/70 bg-white/92 p-5 text-center shadow-[0_28px_90px_rgba(47,37,23,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101419]/92">
                <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-[#f7f0e3] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:border-white/10 dark:bg-white/7 dark:text-[#f1d89b]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    BCCC EASE
                </div>

                <BcccLogoLoader
                    logoSrc="/marketing/images/logo/bccc-seal.png"
                    label={label}
                    showLabel={false}
                    size="lg"
                    className="mx-auto"
                />

                <h3 className="mt-5 text-xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                    {label}
                </h3>

                <p className="mt-2 text-sm leading-7 text-[#6e604c] dark:text-white/60">
                    {sublabel}
                </p>
            </div>
        </div>
    );
}

export default BookingFormLoadingLayer;
