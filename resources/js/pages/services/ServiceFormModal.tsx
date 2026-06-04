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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Service, ServiceTypeOption } from '@/types';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface ServiceFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    service?: Partial<Service> | null;
    serviceTypes: ServiceTypeOption[];
}

export default function ServiceFormModal({
    open,
    onOpenChange,
    mode,
    service,
    serviceTypes,
}: ServiceFormModalProps) {
    const isEdit = mode === 'edit';

    const {
        data,
        setData: rawSetData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
        transform,
    } = useForm({
        service_type_id: '',
        name: '',
        description: '',
        uom: '',
        price: '',
        min_guests: '',
        max_guests: '',
        capacity_note: '',
    });

    const setData = rawSetData as unknown as ((data: Record<string, unknown>) => void) & ((key: string, value: unknown) => void);

    useEffect(() => {
        if (isEdit && service) {
            setData({
                service_type_id: service.service_type_id ?? '',
                name: service.name ?? '',
                description: service.description ?? '',
                uom: service.uom ?? '',
                price: service.price ?? '',
                min_guests: service.min_guests ?? '',
                max_guests: service.max_guests ?? '',
                capacity_note: service.capacity_note ?? '',
            });
            clearErrors();
        } else if (!isEdit) {
            reset();
            clearErrors();
        }
    }, [isEdit, service, open, setData, clearErrors, reset]);

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        const applyTransform = () => ({
            ...data,
            service_type_id:
                data.service_type_id === ''
                    ? null
                    : Number(data.service_type_id),
            price: data.price === '' ? '' : Number(data.price),
            quantity: 1,
            min_guests: data.min_guests === '' ? null : Number(data.min_guests),
            max_guests: data.max_guests === '' ? null : Number(data.max_guests),
            capacity_note:
                data.capacity_note.trim() === ''
                    ? null
                    : data.capacity_note.trim(),
        });

        if (isEdit && service?.id) {
            transform(applyTransform);
            put(`/services/${service.id}`, {
                onSuccess: () => onOpenChange(false),
            });
        } else {
            transform(applyTransform);
            post('/services', {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit service' : 'Create service'}
                    </DialogTitle>
                    <DialogDescription>
                        Create one service per booking option. Quantity and
                        stock are fixed to one because booking availability is
                        controlled by date and time, not stock count.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Service Type</Label>
                            <Select
                                value={String(data.service_type_id ?? '')}
                                onValueChange={(value) =>
                                    setData('service_type_id', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(serviceTypes) &&
                                        serviceTypes.map((t) => (
                                            <SelectItem
                                                key={t.id}
                                                value={String(t.id)}
                                            >
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {errors.service_type_id && (
                                <p className="text-sm text-red-600">
                                    {errors.service_type_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="e.g., Main Hall Whole Day"
                                required
                            />
                            {errors.name && (
                                <p className="text-sm text-red-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <textarea
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Short description"
                            rows={4}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            required
                        />
                        {errors.description && (
                            <p className="text-sm text-red-600">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Unit of Measure</Label>
                            <Input
                                value={data.uom}
                                onChange={(e) => setData('uom', e.target.value)}
                                placeholder="e.g., per booking"
                                required
                            />
                            {errors.uom && (
                                <p className="text-sm text-red-600">
                                    {errors.uom}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Price</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.price}
                                onChange={(e) =>
                                    setData('price', e.target.value)
                                }
                                placeholder="0.00"
                                required
                            />
                            {errors.price && (
                                <p className="text-sm text-red-600">
                                    {errors.price}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border p-4">
                        <div className="mb-3">
                            <p className="font-semibold">Guest Capacity Rule</p>
                            <p className="text-sm text-muted-foreground">
                                Use this when the selected service is only
                                suitable for a limited number of guests.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Minimum Guests</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={data.min_guests}
                                    onChange={(e) =>
                                        setData('min_guests', e.target.value)
                                    }
                                    placeholder="Optional"
                                />
                                {errors.min_guests && (
                                    <p className="text-sm text-red-600">
                                        {errors.min_guests}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Maximum Guests</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={data.max_guests}
                                    onChange={(e) =>
                                        setData('max_guests', e.target.value)
                                    }
                                    placeholder="Optional"
                                />
                                {errors.max_guests && (
                                    <p className="text-sm text-red-600">
                                        {errors.max_guests}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <Label>Capacity Note</Label>
                            <textarea
                                value={data.capacity_note}
                                onChange={(e) =>
                                    setData('capacity_note', e.target.value)
                                }
                                placeholder="Optional guidance, e.g. Best for 50–150 guests only."
                                rows={3}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            />
                            {errors.capacity_note && (
                                <p className="text-sm text-red-600">
                                    {errors.capacity_note}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? isEdit
                                    ? 'Saving...'
                                    : 'Creating...'
                                : isEdit
                                  ? 'Save Changes'
                                  : 'Create Service'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
