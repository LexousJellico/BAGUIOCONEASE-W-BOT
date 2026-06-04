import { BcccLogoLoader } from '@/components/shared/bccc-logo-loader';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type BcccSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    processing?: boolean;
    loadingText?: string;
    icon?: ReactNode;
    variant?: ButtonVariant;
};

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100',
    secondary:
        'border border-black/10 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
    danger:
        'bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400',
    ghost:
        'bg-transparent text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10',
};

export default function BcccSubmitButton({
    processing = false,
    loadingText = 'Saving',
    icon,
    variant = 'primary',
    children,
    disabled,
    className,
    type = 'submit',
    ...props
}: BcccSubmitButtonProps) {
    return (
        <button
            {...props}
            type={type}
            disabled={disabled || processing}
            className={cn(
                'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
                variantClasses[variant],
                className,
            )}
        >
            {processing ? (
                <>
                    <BcccLogoLoader
                        logoSrc="/marketing/images/logo/bccc-seal.png"
                        label={loadingText}
                        showLabel={false}
                        size="sm"
                        className="scale-[0.56]"
                    />
                    <span>{loadingText}...</span>
                </>
            ) : (
                <>
                    {icon ? <span className="shrink-0">{icon}</span> : null}
                    <span>{children}</span>
                </>
            )}
        </button>
    );
}
