export type FloatingControl = 'assistant' | 'availability' | 'info';

const floatingControlEvent = 'bccc:floating-control-open';

export function announceFloatingControlOpen(control: FloatingControl) {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
        new CustomEvent<FloatingControl>(floatingControlEvent, {
            detail: control,
        }),
    );
}

export function onFloatingControlOpen(
    listener: (control: FloatingControl) => void,
) {
    if (typeof window === 'undefined') return () => undefined;

    const handleOpen = (event: Event) => {
        listener((event as CustomEvent<FloatingControl>).detail);
    };

    window.addEventListener(floatingControlEvent, handleOpen);

    return () => window.removeEventListener(floatingControlEvent, handleOpen);
}
