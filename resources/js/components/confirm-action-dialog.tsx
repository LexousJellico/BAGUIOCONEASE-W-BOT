import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

type ConfirmActionDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    processing?: boolean;
    variant?: 'default' | 'destructive';
};

export default function ConfirmActionDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    processing = false,
    variant = 'destructive',
}: ConfirmActionDialogProps) {
    const destructive = variant === 'destructive';
    const Icon = destructive ? Trash2 : CheckCircle2;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md overflow-hidden rounded-[1.85rem] border-0 p-0 shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
                <div className="p-6">
                    <div
                        className={`inline-flex rounded-2xl p-3 ${
                            destructive
                                ? 'bg-rose-500/12 text-rose-600 dark:bg-rose-400/12 dark:text-rose-300'
                                : 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300'
                        }`}
                    >
                        <Icon className="h-6 w-6" />
                    </div>

                    <AlertDialogHeader className="mt-4 text-left">
                        <AlertDialogTitle className="text-xl font-bold">
                            {title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div
                        className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                            destructive
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        }`}
                    >
                        <div className="inline-flex items-center gap-2 font-semibold">
                            <AlertTriangle className="h-4 w-4" />
                            {destructive
                                ? 'This action is permanent.'
                                : 'Please confirm this action.'}
                        </div>
                    </div>

                    <AlertDialogFooter className="mt-6 flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:space-x-0">
                        <AlertDialogCancel
                            disabled={processing}
                            className="mt-0 rounded-full border-black/10 px-5 dark:border-white/10"
                        >
                            {cancelLabel}
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                void onConfirm();
                            }}
                            className={
                                destructive
                                    ? 'rounded-full bg-rose-600 px-5 text-white hover:bg-rose-700 focus:ring-rose-600'
                                    : 'rounded-full bg-[#0f8b6d] px-5 text-white hover:bg-[#0c745c] focus:ring-[#0f8b6d] dark:bg-[#294CFF] dark:hover:bg-[#233dd4]'
                            }
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : confirmLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
