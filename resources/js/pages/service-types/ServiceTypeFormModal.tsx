import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ServiceTypeEntity } from '@/types';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    serviceType?: Partial<ServiceTypeEntity> | null;
}

export default function ServiceTypeFormModal({
    open,
    onOpenChange,
    mode,
    serviceType,
}: Props) {
    const isEdit = mode === 'edit';

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<{ name: string }>({
            name: '',
        });

    useEffect(() => {
        if (isEdit && serviceType) {
            setData({ name: serviceType.name ?? '' });
            clearErrors();
        } else if (!isEdit) {
            reset();
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, serviceType, open]);

    function handleClose() {
        onOpenChange(false);
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEdit && serviceType?.id) {
            put(`/service-types/${serviceType.id}`, {
                onSuccess: () => onOpenChange(false),
            });
        } else {
            post('/service-types', {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={onSubmit} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit
                                ? 'Edit service type'
                                : 'Create service type'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? 'Update the service type name.'
                                : 'Add a new service type.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g., Equipment, Labor"
                            required
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? isEdit
                                    ? 'Saving...'
                                    : 'Creating...'
                                : isEdit
                                  ? 'Save changes'
                                  : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
