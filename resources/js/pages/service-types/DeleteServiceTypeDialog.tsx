import ConfirmActionDialog from '@/components/confirm-action-dialog';
import type { ServiceTypeEntity } from '@/types';
import { useForm } from '@inertiajs/react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serviceType: ServiceTypeEntity | null;
}

export default function DeleteServiceTypeDialog({
    open,
    onOpenChange,
    serviceType,
}: Props) {
    const { delete: destroy, processing } = useForm();

    function onConfirm() {
        if (!serviceType) return;

        destroy(`/service-types/${serviceType.id}`, {
            onSuccess: () => onOpenChange(false),
        });
    }

    return (
        <ConfirmActionDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Delete service type?"
            description={
                serviceType
                    ? `This will permanently delete “${serviceType.name}”. This action cannot be undone.`
                    : 'This action cannot be undone.'
            }
            confirmLabel="Delete service type"
            cancelLabel="Cancel"
            onConfirm={onConfirm}
            processing={processing}
            variant="destructive"
        />
    );
}
