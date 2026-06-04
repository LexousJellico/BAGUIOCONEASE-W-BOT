import ConfirmActionDialog from '@/components/confirm-action-dialog';
import type { Service } from '@/types';
import { useForm } from '@inertiajs/react';

interface DeleteServiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service: Service | null;
}

export default function DeleteServiceDialog({
    open,
    onOpenChange,
    service,
}: DeleteServiceDialogProps) {
    const { delete: destroy, processing } = useForm();

    function onConfirm() {
        if (!service) return;

        destroy(`/services/${service.id}`, {
            onSuccess: () => onOpenChange(false),
        });
    }

    return (
        <ConfirmActionDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Delete service?"
            description={
                service
                    ? `This will permanently delete the service "${service.name}". This action cannot be undone.`
                    : 'This action cannot be undone.'
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={onConfirm}
            processing={processing}
            variant="destructive"
        />
    );
}
