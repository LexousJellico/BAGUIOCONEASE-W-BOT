export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export type FeedbackPayload = {
    type?: FeedbackType;
    title?: string;
    message: string;
    duration?: number;
};

export function pushFeedback(payload: FeedbackPayload) {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent('bccc:feedback', {
            detail: {
                type: payload.type ?? 'info',
                title: payload.title,
                message: payload.message,
                duration: payload.duration,
            },
        }),
    );
}
