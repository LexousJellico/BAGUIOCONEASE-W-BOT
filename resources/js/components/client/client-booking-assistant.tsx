import { getBackendRole, type BackendRole } from '@/lib/backend-navigation';
import {
    announceFloatingControlOpen,
    onFloatingControlOpen,
} from '@/lib/floating-controls';
import { router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bot,
    Check,
    Loader2,
    MessageCircle,
    RotateCcw,
    Send,
    ThumbsDown,
    ThumbsUp,
    X,
} from 'lucide-react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type MouseEvent,
} from 'react';

const assistantEndpoint = '/system-assistant/ask';
const assistantStateEndpoint = '/system-assistant/state';
const assistantBookingDraftEndpoint = '/system-assistant/booking-draft';
const assistantStoragePrefix = 'bccc-ease-assistant-chat:v3:';
const guestStorageKey = `${assistantStoragePrefix}guest`;
const chatRetentionMs = 6 * 60 * 60 * 1000;
const spamMuteMs = 10 * 60 * 1000;
const maxStoredMessages = 60;

const bookingGuidePackages = [
    {
        code: 'GRAND_CONVENTION_PACKAGE',
        label: 'Grand Convention Package',
        hint: 'Full Hall + LED Wall + Lounge + Boardroom, best for 801–2,000 pax',
    },
    {
        code: 'PREMIUM_CONFERENCE_PACKAGE',
        label: 'Premium Conference Package',
        hint: 'Main Hall + LED Wall + Lounge + Boardroom',
    },
    {
        code: 'CORPORATE_FORUM_PACKAGE',
        label: 'Corporate Forum Package',
        hint: 'Main Hall + LED Wall',
    },
    {
        code: 'CEREMONY_AWARDS_PACKAGE',
        label: 'Ceremony & Awards Package',
        hint: 'Main Hall + Lounge + LED Wall',
    },
    {
        code: 'TRAINING_WORKSHOP_PACKAGE',
        label: 'Training & Workshop Package',
        hint: 'Main Hall + Boardroom',
    },
    {
        code: 'EXECUTIVE_MEETING_PACKAGE',
        label: 'Executive Meeting Package',
        hint: 'Lounge + Boardroom, best for smaller executive use',
    },
    {
        code: 'EXHIBIT_TRADE_FAIR_GRAND_PACKAGE',
        label: 'Exhibit & Trade Fair Package - Grand',
        hint: 'Full Hall exhibit setup + support rooms',
    },
    {
        code: 'EXHIBIT_TRADE_FAIR_STANDARD_PACKAGE',
        label: 'Exhibit & Trade Fair Package - Standard',
        hint: 'Main Hall exhibit setup + LED Wall',
    },
] as const;

const manualAreaOptions = [
    {
        code: 'full_hall',
        label: 'Full Hall',
        aliases: ['full hall', 'full', 'convention hall'],
    },
    {
        code: 'main_hall',
        label: 'Main Hall',
        aliases: ['main hall', 'ground hall', 'main'],
    },
    { code: 'led_wall', label: 'LED Wall', aliases: ['led wall', 'led'] },
    {
        code: 'vip_lounge',
        label: 'Lounge / VIP Lounge',
        aliases: ['lounge', 'vip lounge', 'vip'],
    },
    {
        code: 'board_room',
        label: 'Boardroom',
        aliases: ['boardroom', 'board room'],
    },
] as const;

const monthMap: Record<string, number> = {
    january: 1,
    jan: 1,
    february: 2,
    feb: 2,
    march: 3,
    mar: 3,
    april: 4,
    apr: 4,
    may: 5,
    june: 6,
    jun: 6,
    july: 7,
    jul: 7,
    august: 8,
    aug: 8,
    september: 9,
    sep: 9,
    sept: 9,
    october: 10,
    oct: 10,
    november: 11,
    nov: 11,
    december: 12,
    dec: 12,
};

type PublicAssistantRole = BackendRole | 'public';

type SharedProps = {
    auth?: Parameters<typeof getBackendRole>[0];
};

type ChatMessage = {
    id: string;
    role: 'bot' | 'user';
    text: string;
    mode?: 'local' | 'gemini' | 'system';
    fallback?: boolean;
    confidence?: number;
    sourceCount?: number;
    trackingId?: string | null;
    feedback?: 'helpful' | 'unhelpful';
};

type AssistantResponse = {
    answer?: string;
    mode?: 'local' | 'gemini';
    scope?: 'bccc' | 'general';
    fallback?: boolean;
    suggestions?: string[];
    confidence?: number;
    source_count?: number;
    tracking_id?: string | null;
    learned?: boolean;
};

type ServerAssistantState = {
    messages?: ChatMessage[];
    suggestions?: string[];
    open?: boolean;
    role?: PublicAssistantRole;
    surface?: string;
    page_context?: string | null;
    guide?: BookingGuideState | null;
    spam_guard?: SpamGuardState | null;
    last_activity_at?: string | null;
    expires_at?: string | null;
};

type AssistantStateResponse = {
    state?: ServerAssistantState | null;
};

type AssistantBookingDraftResponse = {
    created?: boolean;
    requires_login?: boolean;
    draft_key?: string;
    link?: string;
    message?: string;
};

type BookingGuideStep =
    | 'dates'
    | 'mode'
    | 'package'
    | 'manual_areas'
    | 'event_details'
    | 'confirm';

type BookingGuideState = {
    active: boolean;
    step: BookingGuideStep;
    dateFrom?: string;
    dateTo?: string;
    mode?: 'packages' | 'manual';
    packageCode?: string;
    selectedAreas?: string[];
    eventType?: string;
    guests?: string;
    updatedAt: number;
};

type SpamGuardState = {
    warnings: number;
    mutedUntil?: number | null;
    recent: Array<{ text: string; at: number }>;
};

type StoredAssistantChat = {
    messages: ChatMessage[];
    suggestions: string[];
    open: boolean;
    role: PublicAssistantRole;
    pageContext: string;
    guide?: BookingGuideState | null;
    spamGuard?: SpamGuardState | null;
    updatedAt: number;
    expiresAt?: number | null;
};

function starterSuggestionsFor(role: PublicAssistantRole) {
    if (role === 'admin') {
        return [
            'What should I check first today?',
            'How do I approve a booking?',
            'How do I review payments?',
            'How do I manage calendar blocks?',
        ];
    }

    if (role === 'manager') {
        return [
            'What needs manager review?',
            'How do I approve a booking?',
            'How do I review payments?',
            'How do I check MICE reports?',
        ];
    }

    if (role === 'staff') {
        return [
            'How do I assist a client booking?',
            'How do I check availability?',
            'How do I update booking status?',
            'What notices should I send?',
        ];
    }

    return [
        'How do I book an event?',
        'Is June 20, 2026 available?',
        'What requirements do I need?',
        'Explain payment status',
    ];
}

function csrfToken() {
    if (typeof document === 'undefined') {
        return '';
    }

    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

function messageId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isBackendPath(url: string) {
    return (
        url.startsWith('/admin') ||
        url.startsWith('/manager') ||
        url.startsWith('/staff') ||
        url.startsWith('/bookings') ||
        url.startsWith('/calendar') ||
        url.startsWith('/payments') ||
        url.startsWith('/reports') ||
        url.startsWith('/settings') ||
        url.startsWith('/users')
    );
}

function assistantRole(auth: SharedProps['auth']): PublicAssistantRole {
    if (auth?.user) {
        return getBackendRole(auth);
    }

    return 'public';
}

function pageContextFromUrl(url: string, role: PublicAssistantRole) {
    if (
        url.startsWith('/admin/bookings') ||
        url.startsWith('/manager/bookings') ||
        url.startsWith('/staff/bookings') ||
        url.startsWith('/bookings')
    ) {
        return 'Booking workspace';
    }

    if (url.startsWith('/book')) {
        return role === 'public' ? 'Public booking form' : 'Book Event';
    }

    if (url.startsWith('/notifications')) {
        return 'Notifications';
    }

    if (url.startsWith('/my-bookings')) {
        return 'My Bookings';
    }

    if (url.startsWith('/my-calendar')) {
        return 'My Calendar';
    }

    if (url.startsWith('/calendar') || url.includes('/calendar')) {
        return 'Calendar';
    }

    if (url.startsWith('/settings')) {
        return 'Account Preferences';
    }

    if (url.startsWith('/faqs')) {
        return 'FAQs';
    }

    if (url.startsWith('/guidelines')) {
        return 'Guidelines';
    }

    if (url.startsWith('/facilities')) {
        return 'Facilities';
    }

    if (url.startsWith('/contact')) {
        return 'Contact';
    }

    if (isBackendPath(url)) {
        return 'Staff workspace';
    }

    return 'BCCC EASE';
}

function roleLabel(role: PublicAssistantRole) {
    if (role === 'admin') return 'Admin';
    if (role === 'manager') return 'Manager';
    if (role === 'staff') return 'Staff';
    if (role === 'user') return 'Client';

    return 'Public';
}

function assistantTitle(role: PublicAssistantRole) {
    if (role === 'admin') return 'BCCC Admin Assistant';
    if (role === 'manager') return 'BCCC Manager Assistant';
    if (role === 'staff') return 'BCCC Staff Assistant';

    return 'BCCC Assistant';
}

function assistantTabSmallText(role: PublicAssistantRole) {
    if (role === 'admin') return 'Admin guide';
    if (role === 'manager') return 'Review guide';
    if (role === 'staff') return 'Staff guide';
    if (role === 'public') return 'Ask BCCC';

    return 'Need help?';
}

function assistantPlaceholder(role: PublicAssistantRole) {
    if (role === 'admin')
        return 'Ask admin workflow, bookings, payments, reports...';
    if (role === 'manager') return 'Ask review, approvals, payments, MICE...';
    if (role === 'staff')
        return 'Ask booking assistance, schedules, notices...';

    return 'Message BCCC Assistant...';
}

function introText(role: PublicAssistantRole, pageContext: string) {
    if (role === 'admin') {
        return `Hi, I am your BCCC Admin Assistant. You are on ${pageContext}. I can guide dashboard checks, bookings, approvals, payment review, calendar blocks, reports, content, users/roles, notifications, and setup.\n\nAsk a direct question like “What should I check first today?”`;
    }

    if (role === 'manager') {
        return `Hi, I am your BCCC Manager Assistant. You are on ${pageContext}. I can help with review decisions, approval flow, payment verification, calendar monitoring, MICE registry, and reports.\n\nAsk what you need to review or process.`;
    }

    if (role === 'staff') {
        return `Hi, I am your BCCC Staff Assistant. You are on ${pageContext}. I can help you assist clients, check availability, create assisted bookings, monitor schedules, send notices, and explain booking status.\n\nAsk what task you want to complete.`;
    }

    const privacy =
        role === 'public'
            ? 'I can answer general questions plus public booking, availability, facilities, rates, requirements, FAQs, and contact questions.'
            : 'I can answer general questions and guide you using safe BCCC EASE records, your page context, and your own account notices when available.';

    return `Hi, I am the BCCC EASE assistant. You are on ${pageContext}. ${privacy}\n\nAsk a short question or send a date, for example: “Is June 20, 2026 available?”`;
}

function authUserStorageId(auth: SharedProps['auth']) {
    const user = auth?.user as Record<string, unknown> | undefined;

    if (!user) {
        return null;
    }

    const id = user.id ?? user.email ?? user.name ?? 'current';

    return String(id).replace(/[^a-zA-Z0-9_.@-]/g, '_');
}

function assistantStorageKey(auth: SharedProps['auth']) {
    const userId = authUserStorageId(auth);

    return userId ? `${assistantStoragePrefix}user:${userId}` : guestStorageKey;
}

function safeStorage() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const testKey = `${assistantStoragePrefix}test`;
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);

        return window.localStorage;
    } catch {
        return null;
    }
}

function freshWelcome(
    role: PublicAssistantRole,
    pageContext: string,
): ChatMessage[] {
    return [
        {
            id: messageId('assistant-welcome'),
            role: 'bot',
            text: introText(role, pageContext),
            mode: 'system',
        },
        {
            id: messageId('assistant-retention-notice'),
            role: 'bot',
            text: 'Important notice: This conversation is saved for 6 hours, including when you sign in on this browser, then it is automatically deleted. Never share passwords, OTPs, payment card details, or other highly sensitive information. Please confirm important AI answers with official BCCC records or staff.',
            mode: 'system',
        },
    ];
}

function defaultSpamGuard(): SpamGuardState {
    return { warnings: 0, mutedUntil: null, recent: [] };
}

function normalizeStoredGuide(guide: unknown): BookingGuideState | null {
    if (!guide || typeof guide !== 'object') {
        return null;
    }

    const item = guide as Partial<BookingGuideState>;
    const step = typeof item.step === 'string' ? item.step : 'dates';
    const allowedSteps: BookingGuideStep[] = [
        'dates',
        'mode',
        'package',
        'manual_areas',
        'event_details',
        'confirm',
    ];

    if (!item.active || !allowedSteps.includes(step as BookingGuideStep)) {
        return null;
    }

    return {
        active: true,
        step: step as BookingGuideStep,
        dateFrom: typeof item.dateFrom === 'string' ? item.dateFrom : undefined,
        dateTo: typeof item.dateTo === 'string' ? item.dateTo : undefined,
        mode:
            item.mode === 'packages' || item.mode === 'manual'
                ? item.mode
                : undefined,
        packageCode:
            typeof item.packageCode === 'string' ? item.packageCode : undefined,
        selectedAreas: Array.isArray(item.selectedAreas)
            ? item.selectedAreas.filter(
                  (value): value is string => typeof value === 'string',
              )
            : [],
        eventType:
            typeof item.eventType === 'string' ? item.eventType : undefined,
        guests: typeof item.guests === 'string' ? item.guests : undefined,
        updatedAt: Number(item.updatedAt) || Date.now(),
    };
}

function normalizeSpamGuard(guard: unknown): SpamGuardState {
    if (!guard || typeof guard !== 'object') {
        return defaultSpamGuard();
    }

    const item = guard as Partial<SpamGuardState>;

    return {
        warnings: Math.max(0, Math.min(3, Number(item.warnings) || 0)),
        mutedUntil:
            typeof item.mutedUntil === 'number' ? item.mutedUntil : null,
        recent: Array.isArray(item.recent)
            ? item.recent
                  .map((row) => ({
                      text: typeof row?.text === 'string' ? row.text : '',
                      at: Number(row?.at) || 0,
                  }))
                  .filter((row) => row.text && row.at > 0)
                  .slice(-8)
            : [],
    };
}

function normalizeStoredMessages(messages: unknown): ChatMessage[] {
    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .filter((message): message is ChatMessage => {
            if (!message || typeof message !== 'object') {
                return false;
            }

            const item = message as Record<string, unknown>;

            return (
                typeof item.id === 'string' &&
                (item.role === 'bot' || item.role === 'user') &&
                typeof item.text === 'string' &&
                item.text.trim() !== ''
            );
        })
        .slice(-maxStoredMessages);
}

function claimGuestStoredAssistantChat(
    storageKey: string,
    role: PublicAssistantRole,
    pageContext: string,
) {
    if (storageKey === guestStorageKey) {
        return;
    }

    const storage = safeStorage();

    if (!storage) {
        return;
    }

    try {
        const guest = JSON.parse(
            storage.getItem(guestStorageKey) || 'null',
        ) as Partial<StoredAssistantChat> | null;

        if (
            !guest ||
            typeof guest !== 'object' ||
            (typeof guest.expiresAt === 'number' &&
                guest.expiresAt <= Date.now())
        ) {
            storage.removeItem(guestStorageKey);
            return;
        }

        const guestMessages = normalizeStoredMessages(guest.messages);

        if (guestMessages.length === 0) {
            storage.removeItem(guestStorageKey);
            return;
        }

        const current = JSON.parse(
            storage.getItem(storageKey) || 'null',
        ) as Partial<StoredAssistantChat> | null;
        const currentMessages = normalizeStoredMessages(current?.messages);
        const guestUpdatedAt = Number(guest.updatedAt) || 0;
        const currentUpdatedAt = Number(current?.updatedAt) || 0;
        const latest = guestUpdatedAt >= currentUpdatedAt ? guest : current;
        const orderedMessages =
            guestUpdatedAt >= currentUpdatedAt
                ? [...currentMessages, ...guestMessages]
                : [...guestMessages, ...currentMessages];
        const seen = new Set<string>();
        const messages = orderedMessages
            .filter((message) => {
                if (seen.has(message.id)) {
                    return false;
                }

                seen.add(message.id);
                return true;
            })
            .slice(-maxStoredMessages);
        const suggestions = Array.isArray(latest?.suggestions)
            ? latest.suggestions
                  .filter(
                      (item): item is string =>
                          typeof item === 'string' && item.trim() !== '',
                  )
                  .slice(0, 4)
            : starterSuggestionsFor(role);

        storage.setItem(
            storageKey,
            JSON.stringify({
                messages,
                suggestions:
                    suggestions.length > 0
                        ? suggestions
                        : starterSuggestionsFor(role),
                open: Boolean(latest?.open),
                role,
                pageContext,
                guide: normalizeStoredGuide(latest?.guide),
                spamGuard: normalizeSpamGuard(latest?.spamGuard),
                updatedAt: Date.now(),
                expiresAt: Date.now() + chatRetentionMs,
            } satisfies StoredAssistantChat),
        );
        storage.removeItem(guestStorageKey);
    } catch {
        storage.removeItem(guestStorageKey);
    }
}

function loadStoredAssistantChat(
    storageKey: string,
    role: PublicAssistantRole,
    pageContext: string,
): StoredAssistantChat {
    claimGuestStoredAssistantChat(storageKey, role, pageContext);

    const fallback: StoredAssistantChat = {
        messages: freshWelcome(role, pageContext),
        suggestions: starterSuggestionsFor(role),
        open: false,
        role,
        pageContext,
        guide: null,
        spamGuard: defaultSpamGuard(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + chatRetentionMs,
    };

    const storage = safeStorage();

    if (!storage) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(
            storage.getItem(storageKey) || 'null',
        ) as Partial<StoredAssistantChat> | null;

        if (!parsed || typeof parsed !== 'object') {
            return fallback;
        }

        const isExpired =
            typeof parsed.expiresAt === 'number' &&
            parsed.expiresAt <= Date.now();

        if (isExpired) {
            storage.removeItem(storageKey);
            return fallback;
        }

        const messages = normalizeStoredMessages(parsed.messages);

        if (messages.length === 0) {
            return fallback;
        }

        const suggestions = Array.isArray(parsed.suggestions)
            ? parsed.suggestions
                  .filter(
                      (item): item is string =>
                          typeof item === 'string' && item.trim() !== '',
                  )
                  .slice(0, 4)
            : starterSuggestionsFor(role);

        return {
            messages,
            suggestions:
                suggestions.length > 0
                    ? suggestions
                    : starterSuggestionsFor(role),
            open: Boolean(parsed.open),
            role,
            pageContext,
            guide: normalizeStoredGuide(parsed.guide),
            spamGuard: normalizeSpamGuard(parsed.spamGuard),
            updatedAt: Number(parsed.updatedAt) || Date.now(),
            expiresAt: Date.now() + chatRetentionMs,
        };
    } catch {
        storage.removeItem(storageKey);
        return fallback;
    }
}

function saveStoredAssistantChat(
    storageKey: string,
    role: PublicAssistantRole,
    pageContext: string,
    messages: ChatMessage[],
    suggestions: string[],
    open: boolean,
    guide: BookingGuideState | null = null,
    spamGuard: SpamGuardState = defaultSpamGuard(),
) {
    const storage = safeStorage();

    if (!storage) {
        return;
    }

    const payload: StoredAssistantChat = {
        messages: normalizeStoredMessages(messages),
        suggestions: suggestions.filter(Boolean).slice(0, 4),
        open,
        role,
        pageContext,
        guide,
        spamGuard,
        updatedAt: Date.now(),
        expiresAt: Date.now() + chatRetentionMs,
    };

    try {
        storage.setItem(storageKey, JSON.stringify(payload));
    } catch {
        // Storage quota or private browsing can fail safely. Chat remains in memory.
    }
}

async function fetchServerAssistantState(): Promise<ServerAssistantState | null> {
    try {
        const response = await fetch(assistantStateEndpoint, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok) {
            return null;
        }

        const payload = (await response.json()) as AssistantStateResponse;

        return payload.state ?? null;
    } catch {
        return null;
    }
}

async function saveServerAssistantState(
    role: PublicAssistantRole,
    surface: 'public' | 'client' | 'backend',
    pageContext: string,
    messages: ChatMessage[],
    suggestions: string[],
    open: boolean,
    guide: BookingGuideState | null,
    spamGuard: SpamGuardState,
) {
    try {
        await fetch(assistantStateEndpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                role,
                surface,
                page_context: pageContext,
                open,
                messages: normalizeStoredMessages(messages),
                suggestions: suggestions.filter(Boolean).slice(0, 4),
                guide,
                spam_guard: spamGuard,
            }),
        });
    } catch {
        // Local storage remains the fast fallback when the server state endpoint is unavailable.
    }
}

async function sendAssistantFeedback(
    trackingId: string,
    helpful: boolean,
    correction?: string,
) {
    const response = await fetch('/system-assistant/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
            tracking_id: trackingId,
            helpful,
            correction: correction?.trim() || undefined,
        }),
    });

    if (!response.ok) {
        throw new Error('Assistant feedback failed');
    }
}

function assistantMeta(message: ChatMessage) {
    if (message.mode === 'system') {
        return 'BCCC guide';
    }

    const parts = [
        message.mode === 'gemini' ? 'AI + system search' : 'System search',
    ];

    if (message.sourceCount) {
        parts.push(
            `${message.sourceCount} source${message.sourceCount === 1 ? '' : 's'}`,
        );
    }

    if (typeof message.confidence === 'number') {
        parts.push(`${message.confidence}% match`);
    }

    if (message.fallback) {
        parts.push('fallback');
    }

    return parts.join(' • ');
}

function pad2(value: number) {
    return String(value).padStart(2, '0');
}

function validDate(year: number, month: number, day: number) {
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return `${year}-${pad2(month)}-${pad2(day)}`;
}

function extractDateRangeForGuide(
    message: string,
): { from: string; to: string } | null {
    const normalized = message
        .replace(/[–—]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
    const monthPattern = Object.keys(monthMap).join('|');
    const textRange = normalized.match(
        new RegExp(
            `\\b(${monthPattern})\\.?\\s+(\\d{1,2})(?:\\s*(?:-|to|until)\\s*(?:(?:${monthPattern})\\.?\\s+)?(\\d{1,2}))?\\s*,?\\s*(20\\d{2})\\b`,
            'i',
        ),
    );

    if (textRange) {
        const month = monthMap[textRange[1].toLowerCase()];
        const startDay = Number(textRange[2]);
        const endDay = Number(textRange[3] || textRange[2]);
        const year = Number(textRange[4]);
        const from = validDate(year, month, startDay);
        const to = validDate(year, month, endDay);

        return from && to ? { from, to } : null;
    }

    const isoRange = normalized.match(
        /\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})(?:\s*(?:-|to|until)\s*(?:(20\d{2})[-/](\d{1,2})[-/])?(\d{1,2}))?\b/i,
    );

    if (isoRange) {
        const year = Number(isoRange[1]);
        const month = Number(isoRange[2]);
        const day = Number(isoRange[3]);
        const endYear = Number(isoRange[4] || isoRange[1]);
        const endMonth = Number(isoRange[5] || isoRange[2]);
        const endDay = Number(isoRange[6] || isoRange[3]);
        const from = validDate(year, month, day);
        const to = validDate(endYear, endMonth, endDay);

        return from && to ? { from, to } : null;
    }

    return null;
}

function startsBookingGuide(message: string) {
    const lower = message.toLowerCase();

    return (
        (/\b(guide|assist|help|create|prepare|start)\b/.test(lower) &&
            /\b(book|booking|reserve|reservation|event)\b/.test(lower)) ||
        /\bbook\s+(the\s+)?date\b/.test(lower)
    );
}

function packageOptionsText() {
    return bookingGuidePackages
        .map((item, index) => `${index + 1}. ${item.label} — ${item.hint}`)
        .join('\n');
}

function manualAreaOptionsText() {
    return manualAreaOptions
        .map((item, index) => `${index + 1}. ${item.label}`)
        .join('\n');
}

function findPackageFromMessage(message: string) {
    const lower = message.toLowerCase();
    const number = lower.match(/\b([1-8])\b/);

    if (number) {
        return bookingGuidePackages[Number(number[1]) - 1]?.code;
    }

    return bookingGuidePackages.find((item) => {
        const label = item.label.toLowerCase();
        const compact = label.replace(/[^a-z0-9]+/g, ' ').trim();
        const code = item.code.toLowerCase();

        return (
            lower.includes(label) ||
            lower.includes(compact) ||
            lower.includes(code)
        );
    })?.code;
}

function findManualAreasFromMessage(message: string) {
    const lower = message.toLowerCase();
    const matched = new Set<string>();

    manualAreaOptions.forEach((item, index) => {
        if (
            new RegExp(`\\b${index + 1}\\b`).test(lower) ||
            item.aliases.some((alias) => lower.includes(alias))
        ) {
            matched.add(item.code);
        }
    });

    return Array.from(matched);
}

function extractGuests(message: string) {
    const match = message.match(
        /\b(\d{1,5})\s*(?:pax|guest|guests|attendee|attendees|people|persons)?\b/i,
    );

    return match ? match[1] : undefined;
}

function cleanEventType(message: string) {
    const cleaned = message
        .replace(
            /\b\d{1,5}\s*(?:pax|guest|guests|attendee|attendees|people|persons)?\b/gi,
            '',
        )
        .replace(
            /\b(event|type|guests|pax|attendees|people|is|are|for|with|about)\b/gi,
            ' ',
        )
        .replace(/[^a-zA-Z0-9 &/'-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return cleaned.length >= 3 ? cleaned : undefined;
}

function formatDateRange(guide: BookingGuideState) {
    if (!guide.dateFrom) {
        return 'No date selected yet';
    }

    return guide.dateTo && guide.dateTo !== guide.dateFrom
        ? `${guide.dateFrom} to ${guide.dateTo}`
        : guide.dateFrom;
}

function selectedPackageLabel(code?: string) {
    return (
        bookingGuidePackages.find((item) => item.code === code)?.label ??
        code ??
        'Not selected'
    );
}

function selectedAreaLabels(areas?: string[]) {
    if (!areas?.length) {
        return 'Not selected';
    }

    return areas
        .map(
            (code) =>
                manualAreaOptions.find((item) => item.code === code)?.label ??
                code,
        )
        .join(', ');
}

function bookingCreateBasePath(surface: 'public' | 'client' | 'backend') {
    return surface === 'backend' ? '/bookings/create' : '/book';
}

function buildBookingGuideLink(
    guide: BookingGuideState,
    surface: 'public' | 'client' | 'backend',
) {
    const params = new URLSearchParams();

    if (guide.dateFrom) params.set('start_date', guide.dateFrom);
    if (guide.dateTo) params.set('end_date', guide.dateTo);
    if (guide.packageCode && guide.mode === 'packages')
        params.set('package', guide.packageCode);
    if (guide.mode === 'manual' && guide.selectedAreas?.length)
        params.set('areas', guide.selectedAreas.join(','));
    if (guide.eventType) params.set('event_type', guide.eventType);
    if (guide.guests) params.set('guests', guide.guests);
    params.set('assistant_booking', '1');

    return `${bookingCreateBasePath(surface)}?${params.toString()}`;
}

async function createAssistantBookingDraft(
    guide: BookingGuideState,
    surface: 'public' | 'client' | 'backend',
): Promise<AssistantBookingDraftResponse> {
    if (!guide.dateFrom || !guide.dateTo || !guide.mode) {
        return {
            created: false,
            link: buildBookingGuideLink(guide, surface),
            message:
                'The booking guide is missing required details. Please complete the date, selection, event type, and guests first.',
        };
    }

    try {
        const response = await fetch(assistantBookingDraftEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                date_from: guide.dateFrom,
                date_to: guide.dateTo,
                mode: guide.mode,
                package_code: guide.packageCode,
                selected_areas: guide.selectedAreas ?? [],
                event_type: guide.eventType,
                guests: guide.guests,
                surface,
            }),
        });

        if (!response.ok) {
            throw new Error('Unable to create assistant booking draft');
        }

        return (await response.json()) as AssistantBookingDraftResponse;
    } catch {
        return {
            created: false,
            link: buildBookingGuideLink(guide, surface),
            message:
                'I prepared a booking form link. The server draft could not be saved right now, so please review the form carefully before submitting.',
        };
    }
}

function bookingGuideSummary(guide: BookingGuideState) {
    const selection =
        guide.mode === 'manual'
            ? selectedAreaLabels(guide.selectedAreas)
            : selectedPackageLabel(guide.packageCode);

    return [
        `Date: ${formatDateRange(guide)}`,
        `Selection: ${selection}`,
        `Event type: ${guide.eventType || 'Not provided'}`,
        `Guests: ${guide.guests || 'Not provided'}`,
    ].join('\n');
}

function guideSuggestionsFor(step: BookingGuideStep): string[] {
    if (step === 'dates')
        return ['June 12-14, 2026', '2026-06-12 to 2026-06-14'];
    if (step === 'mode') return ['Use package', 'Manual services'];
    if (step === 'package') return ['1', '2', 'Executive Meeting Package'];
    if (step === 'manual_areas')
        return ['Main Hall and LED Wall', 'Lounge and Boardroom', 'Full Hall'];
    if (step === 'event_details')
        return ['Conference, 300 guests', 'Meeting, 50 pax'];

    return ['Yes, prepare it', 'Change package', 'Change date'];
}

function suspiciousChatMessage(
    message: string,
    recent: SpamGuardState['recent'],
) {
    const now = Date.now();
    const lower = message.toLowerCase().trim();
    const compact = lower.replace(/\s+/g, '');
    const recentWindow = recent.filter((item) => now - item.at < 30_000);
    const repeatedSame =
        recentWindow.filter((item) => item.text === lower).length >= 2;
    const rapidSpam = recentWindow.length >= 6;
    const oneChar = compact.length === 1;
    const repeatedChars = compact.length >= 5 && /^(.)\1+$/.test(compact);
    const gibberish = compact.length >= 7 && !/[aeiou0-9]/i.test(compact);

    return repeatedSame || rapidSpam || oneChar || repeatedChars || gibberish;
}

function mutedMessage(mutedUntil?: number | null) {
    const remainingMs = Math.max(0, (mutedUntil ?? 0) - Date.now());
    const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));

    return `Chat is temporarily paused for ${minutes} minute${minutes === 1 ? '' : 's'} because of repeated spam-like messages. This protects the assistant memory and system resources. Please try again after the timer ends.`;
}

function internalVisit(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (
        /^https?:\/\//i.test(href) ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
    ) {
        return;
    }

    event.preventDefault();
    router.visit(href);
}

function AssistantText({ text }: { text: string }) {
    const renderInline = (line: string, lineIndex: number) => {
        const parts: Array<string | { label: string; href: string }> = [];
        const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(line)) !== null) {
            if (match.index > lastIndex) {
                parts.push(line.slice(lastIndex, match.index));
            }

            parts.push({ label: match[1], href: match[2] });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < line.length) {
            parts.push(line.slice(lastIndex));
        }

        return parts.map((part, partIndex) => {
            if (typeof part === 'string') {
                return (
                    <span key={`${lineIndex}-text-${partIndex}`}>{part}</span>
                );
            }

            return (
                <a
                    key={`${lineIndex}-link-${partIndex}`}
                    href={part.href}
                    onClick={(event) => internalVisit(event, part.href)}
                    className="bccc-client-chat-link"
                >
                    {part.label}
                </a>
            );
        });
    };

    return (
        <>
            {text.split('\n').map((line, index) => {
                const trimmed = line.trim();

                if (!trimmed) {
                    return <span key={`gap-${index}`} className="block h-1" />;
                }

                return (
                    <p key={`${trimmed}-${index}`}>
                        {renderInline(trimmed, index)}
                    </p>
                );
            })}
        </>
    );
}

export default function ClientBookingAssistant() {
    const page = usePage();
    const props = page.props as SharedProps;
    const currentUrl = page.url || '/';
    const role = assistantRole(props.auth);
    const pageContext = useMemo(
        () => pageContextFromUrl(currentUrl, role),
        [currentUrl, role],
    );
    const storageKey = useMemo(
        () => assistantStorageKey(props.auth),
        [props.auth],
    );

    const [activeStorageKey, setActiveStorageKey] = useState(storageKey);
    const [open, setOpen] = useState(
        () => loadStoredAssistantChat(storageKey, role, pageContext).open,
    );
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>(
        () =>
            loadStoredAssistantChat(storageKey, role, pageContext).suggestions,
    );
    const [messages, setMessages] = useState<ChatMessage[]>(
        () => loadStoredAssistantChat(storageKey, role, pageContext).messages,
    );
    const [bookingGuide, setBookingGuide] = useState<BookingGuideState | null>(
        () =>
            loadStoredAssistantChat(storageKey, role, pageContext).guide ??
            null,
    );
    const [spamGuard, setSpamGuard] = useState<SpamGuardState>(
        () =>
            loadStoredAssistantChat(storageKey, role, pageContext).spamGuard ??
            defaultSpamGuard(),
    );

    const inputRef = useRef<HTMLInputElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const latestStateRef = useRef({
        storageKey,
        role,
        pageContext,
        messages,
        dynamicSuggestions,
        open,
        bookingGuide,
        spamGuard,
    });
    const serverRestoreKeyRef = useRef<string | null>(null);
    const serverSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    const isPublic = role === 'public';
    const isPrivileged =
        role === 'admin' || role === 'manager' || role === 'staff';
    const surface = isPublic ? 'public' : isPrivileged ? 'backend' : 'client';
    const isAdminSurface = surface === 'backend';

    useEffect(() => {
        if (storageKey === activeStorageKey) {
            return;
        }

        const nextStoredChat = loadStoredAssistantChat(
            storageKey,
            role,
            pageContext,
        );
        setActiveStorageKey(storageKey);
        setOpen(nextStoredChat.open);
        setDynamicSuggestions(nextStoredChat.suggestions);
        setMessages(nextStoredChat.messages);
        setBookingGuide(nextStoredChat.guide ?? null);
        setSpamGuard(nextStoredChat.spamGuard ?? defaultSpamGuard());
        setInput('');
        setLoading(false);
    }, [activeStorageKey, storageKey, role, pageContext]);

    useEffect(() => {
        latestStateRef.current = {
            storageKey,
            role,
            pageContext,
            messages,
            dynamicSuggestions,
            open,
            bookingGuide,
            spamGuard,
        };

        saveStoredAssistantChat(
            storageKey,
            role,
            pageContext,
            messages,
            dynamicSuggestions,
            open,
            bookingGuide,
            spamGuard,
        );
    }, [
        storageKey,
        role,
        pageContext,
        messages,
        dynamicSuggestions,
        open,
        bookingGuide,
        spamGuard,
    ]);

    useEffect(() => {
        let cancelled = false;

        if (serverRestoreKeyRef.current === storageKey) {
            return () => {
                cancelled = true;
            };
        }

        serverRestoreKeyRef.current = storageKey;

        void fetchServerAssistantState().then((state) => {
            if (cancelled || !state) {
                return;
            }

            const serverMessages = normalizeStoredMessages(state.messages);

            if (serverMessages.length === 0) {
                return;
            }

            const localSnapshot = loadStoredAssistantChat(
                storageKey,
                role,
                pageContext,
            );
            const serverUpdatedAt =
                Date.parse(state.last_activity_at || '') || 0;
            const shouldUseServer =
                serverMessages.length > localSnapshot.messages.length ||
                localSnapshot.messages.length <= 1 ||
                (serverUpdatedAt > 0 &&
                    serverUpdatedAt >= localSnapshot.updatedAt);

            if (!shouldUseServer) {
                return;
            }

            const nextSuggestions =
                Array.isArray(state.suggestions) && state.suggestions.length > 0
                    ? state.suggestions.filter(Boolean).slice(0, 4)
                    : starterSuggestionsFor(role);
            const nextGuide = normalizeStoredGuide(state.guide);
            const nextSpamGuard = normalizeSpamGuard(state.spam_guard);
            const nextOpen = Boolean(state.open);

            setOpen(nextOpen);
            setDynamicSuggestions(nextSuggestions);
            setMessages(serverMessages);
            setBookingGuide(nextGuide);
            setSpamGuard(nextSpamGuard);

            saveStoredAssistantChat(
                storageKey,
                role,
                pageContext,
                serverMessages,
                nextSuggestions,
                nextOpen,
                nextGuide,
                nextSpamGuard,
            );
        });

        return () => {
            cancelled = true;
        };
    }, [storageKey, role, pageContext]);

    useEffect(() => {
        if (serverSaveTimerRef.current) {
            clearTimeout(serverSaveTimerRef.current);
        }

        serverSaveTimerRef.current = setTimeout(() => {
            void saveServerAssistantState(
                role,
                surface,
                pageContext,
                messages,
                dynamicSuggestions,
                open,
                bookingGuide,
                spamGuard,
            );
        }, 650);

        return () => {
            if (serverSaveTimerRef.current) {
                clearTimeout(serverSaveTimerRef.current);
            }
        };
    }, [
        role,
        surface,
        pageContext,
        messages,
        dynamicSuggestions,
        open,
        bookingGuide,
        spamGuard,
    ]);

    useEffect(() => {
        const removeListener = router.on('before', () => {
            const current = latestStateRef.current;
            saveStoredAssistantChat(
                current.storageKey,
                current.role,
                current.pageContext,
                current.messages,
                current.dynamicSuggestions,
                current.open,
                current.bookingGuide,
                current.spamGuard,
            );
        });

        return () => {
            removeListener();
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const persistBeforeUnload = () => {
            const current = latestStateRef.current;
            saveStoredAssistantChat(
                current.storageKey,
                current.role,
                current.pageContext,
                current.messages,
                current.dynamicSuggestions,
                current.open,
                current.bookingGuide,
                current.spamGuard,
            );
        };

        window.addEventListener('beforeunload', persistBeforeUnload);

        return () =>
            window.removeEventListener('beforeunload', persistBeforeUnload);
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => {
            const storage = safeStorage();
            if (!storage) {
                return;
            }

            try {
                const parsed = JSON.parse(
                    storage.getItem(storageKey) || 'null',
                ) as Partial<StoredAssistantChat> | null;
                const isExpired =
                    typeof parsed?.expiresAt === 'number' &&
                    parsed.expiresAt <= Date.now();

                if (!isExpired) {
                    return;
                }

                storage.removeItem(storageKey);
                setOpen(false);
                setDynamicSuggestions(starterSuggestionsFor(role));
                setMessages(freshWelcome(role, pageContext));
                setBookingGuide(null);
                setSpamGuard(defaultSpamGuard());
                setInput('');
            } catch {
                storage.removeItem(storageKey);
            }
        }, 30_000);

        return () => window.clearInterval(interval);
    }, [storageKey, role, pageContext]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
        });
    }, [messages, loading, open]);

    useEffect(() => {
        if (!open) return;

        window.setTimeout(() => inputRef.current?.focus(), 120);
    }, [open]);

    useEffect(
        () =>
            onFloatingControlOpen((control) => {
                if (control !== 'assistant') {
                    setOpen(false);
                }
            }),
        [],
    );

    const persistOpenState = (nextOpen: boolean) => {
        if (nextOpen) {
            announceFloatingControlOpen('assistant');
        }

        setOpen(nextOpen);
        saveStoredAssistantChat(
            storageKey,
            role,
            pageContext,
            messages,
            dynamicSuggestions,
            nextOpen,
            bookingGuide,
            spamGuard,
        );
    };

    const appendBotMessage = (
        text: string,
        suggestions: string[] = dynamicSuggestions,
        mode: ChatMessage['mode'] = 'system',
    ) => {
        setDynamicSuggestions(suggestions.slice(0, 4));
        setMessages((current) => [
            ...current,
            { id: messageId('bot'), role: 'bot', text, mode },
        ]);
    };

    const handleBookingGuideMessage = async (
        message: string,
    ): Promise<boolean> => {
        const lower = message.toLowerCase();
        let guide = bookingGuide;

        if (!guide?.active && !startsBookingGuide(message)) {
            return false;
        }

        if (
            guide?.active &&
            /\b(cancel|stop|reset guide|exit guide)\b/.test(lower)
        ) {
            setBookingGuide(null);
            appendBotMessage(
                'Booking guide cancelled. You can start again anytime by asking “Guide me to book an event.”',
                starterSuggestionsFor(role),
            );
            return true;
        }

        if (!guide?.active) {
            const dateRange = extractDateRangeForGuide(message);
            guide = {
                active: true,
                step: dateRange ? 'mode' : 'dates',
                dateFrom: dateRange?.from,
                dateTo: dateRange?.to,
                selectedAreas: [],
                updatedAt: Date.now(),
            };

            setBookingGuide(guide);

            if (!dateRange) {
                appendBotMessage(
                    'Sure. I can guide you step by step. First, what date or date range do you want to book? Example: “June 12-14, 2026”.',
                    guideSuggestionsFor('dates'),
                );
                return true;
            }

            appendBotMessage(
                `I found your preferred schedule: ${formatDateRange(guide)}.\n\nWould you like to use a ready package or manually choose venue/service areas?`,
                guideSuggestionsFor('mode'),
            );
            return true;
        }

        if (guide.step === 'dates') {
            const dateRange = extractDateRangeForGuide(message);

            if (!dateRange) {
                appendBotMessage(
                    'Please send a complete date or range. Example: “June 12-14, 2026” or “2026-06-12 to 2026-06-14”.',
                    guideSuggestionsFor('dates'),
                );
                return true;
            }

            const nextGuide = {
                ...guide,
                step: 'mode' as BookingGuideStep,
                dateFrom: dateRange.from,
                dateTo: dateRange.to,
                updatedAt: Date.now(),
            };
            setBookingGuide(nextGuide);
            appendBotMessage(
                `Schedule saved: ${formatDateRange(nextGuide)}.\n\nWould you like a ready package or manual venue/service selection?`,
                guideSuggestionsFor('mode'),
            );
            return true;
        }

        if (guide.step === 'mode') {
            const foundPackage = findPackageFromMessage(message);
            const areas = findManualAreasFromMessage(message);

            if (
                /\b(package|packages|ready|preset)\b/.test(lower) ||
                foundPackage
            ) {
                const nextGuide = {
                    ...guide,
                    mode: 'packages' as const,
                    packageCode: foundPackage,
                    step: foundPackage
                        ? ('event_details' as BookingGuideStep)
                        : ('package' as BookingGuideStep),
                    updatedAt: Date.now(),
                };
                setBookingGuide(nextGuide);

                if (foundPackage) {
                    appendBotMessage(
                        `Package selected: ${selectedPackageLabel(foundPackage)}.\n\nNow send the event type and estimated guests. Example: “Conference, 300 guests”.`,
                        guideSuggestionsFor('event_details'),
                    );
                    return true;
                }

                appendBotMessage(
                    `Choose one package by number or name:\n${packageOptionsText()}`,
                    guideSuggestionsFor('package'),
                );
                return true;
            }

            if (
                /\b(manual|custom|choose area|services|areas|venue)\b/.test(
                    lower,
                ) ||
                areas.length > 0
            ) {
                const nextGuide = {
                    ...guide,
                    mode: 'manual' as const,
                    selectedAreas: areas,
                    step:
                        areas.length > 0
                            ? ('event_details' as BookingGuideStep)
                            : ('manual_areas' as BookingGuideStep),
                    updatedAt: Date.now(),
                };
                setBookingGuide(nextGuide);

                if (areas.length > 0) {
                    appendBotMessage(
                        `Manual areas selected: ${selectedAreaLabels(areas)}.\n\nNow send the event type and estimated guests. Example: “Seminar, 150 guests”.`,
                        guideSuggestionsFor('event_details'),
                    );
                    return true;
                }

                appendBotMessage(
                    `Choose the venue/service areas you need. You can send names or numbers:\n${manualAreaOptionsText()}`,
                    guideSuggestionsFor('manual_areas'),
                );
                return true;
            }

            appendBotMessage(
                'Please choose one: “Use package” or “Manual services”.',
                guideSuggestionsFor('mode'),
            );
            return true;
        }

        if (guide.step === 'package') {
            const packageCode = findPackageFromMessage(message);

            if (!packageCode) {
                appendBotMessage(
                    `I could not match that package. Please choose by number or name:\n${packageOptionsText()}`,
                    guideSuggestionsFor('package'),
                );
                return true;
            }

            const nextGuide = {
                ...guide,
                packageCode,
                step: 'event_details' as BookingGuideStep,
                updatedAt: Date.now(),
            };
            setBookingGuide(nextGuide);
            appendBotMessage(
                `Package selected: ${selectedPackageLabel(packageCode)}.\n\nNow send the event type and estimated guests. Example: “Conference, 300 guests”.`,
                guideSuggestionsFor('event_details'),
            );
            return true;
        }

        if (guide.step === 'manual_areas') {
            const areas = findManualAreasFromMessage(message);

            if (areas.length === 0) {
                appendBotMessage(
                    `Please choose at least one area by name or number:\n${manualAreaOptionsText()}`,
                    guideSuggestionsFor('manual_areas'),
                );
                return true;
            }

            const nextGuide = {
                ...guide,
                selectedAreas: areas,
                step: 'event_details' as BookingGuideStep,
                updatedAt: Date.now(),
            };
            setBookingGuide(nextGuide);
            appendBotMessage(
                `Manual areas selected: ${selectedAreaLabels(areas)}.\n\nNow send the event type and estimated guests. Example: “Seminar, 150 guests”.`,
                guideSuggestionsFor('event_details'),
            );
            return true;
        }

        if (guide.step === 'event_details') {
            const guests = extractGuests(message) ?? guide.guests;
            const eventType = cleanEventType(message) ?? guide.eventType;

            if (!eventType || !guests) {
                const missing = [
                    !eventType ? 'event type' : null,
                    !guests ? 'estimated guests' : null,
                ]
                    .filter(Boolean)
                    .join(' and ');
                const nextGuide = {
                    ...guide,
                    eventType,
                    guests,
                    updatedAt: Date.now(),
                };
                setBookingGuide(nextGuide);
                appendBotMessage(
                    `I still need the ${missing}. Example: “Conference, 300 guests”.`,
                    guideSuggestionsFor('event_details'),
                );
                return true;
            }

            const nextGuide = {
                ...guide,
                eventType,
                guests,
                step: 'confirm' as BookingGuideStep,
                updatedAt: Date.now(),
            };
            setBookingGuide(nextGuide);
            appendBotMessage(
                `Please review this booking guide draft:\n${bookingGuideSummary(nextGuide)}\n\nShould I prepare the booking form link now?`,
                guideSuggestionsFor('confirm'),
            );
            return true;
        }

        if (guide.step === 'confirm') {
            if (/\b(change date|date)\b/.test(lower)) {
                const nextGuide = {
                    ...guide,
                    step: 'dates' as BookingGuideStep,
                    updatedAt: Date.now(),
                };
                setBookingGuide(nextGuide);
                appendBotMessage(
                    'Okay. Send the corrected date or date range.',
                    guideSuggestionsFor('dates'),
                );
                return true;
            }

            if (/\b(change package|package)\b/.test(lower)) {
                const nextGuide = {
                    ...guide,
                    mode: 'packages' as const,
                    packageCode: undefined,
                    step: 'package' as BookingGuideStep,
                    updatedAt: Date.now(),
                };
                setBookingGuide(nextGuide);
                appendBotMessage(
                    `Choose the package again:\n${packageOptionsText()}`,
                    guideSuggestionsFor('package'),
                );
                return true;
            }

            if (/\b(change area|manual|service)\b/.test(lower)) {
                const nextGuide = {
                    ...guide,
                    mode: 'manual' as const,
                    selectedAreas: [],
                    step: 'manual_areas' as BookingGuideStep,
                    updatedAt: Date.now(),
                };
                setBookingGuide(nextGuide);
                appendBotMessage(
                    `Choose the manual areas again:\n${manualAreaOptionsText()}`,
                    guideSuggestionsFor('manual_areas'),
                );
                return true;
            }

            if (
                /\b(yes|proceed|prepare|create|complete|submit|go)\b/.test(
                    lower,
                )
            ) {
                const draft = await createAssistantBookingDraft(guide, surface);
                const link =
                    draft.link || buildBookingGuideLink(guide, surface);
                const draftLine = draft.created
                    ? 'I also saved it as a booking draft in your account.'
                    : draft.requires_login
                      ? 'Because you are not logged in, I prepared a safe booking link first. Please log in before final submission.'
                      : 'I prepared a safe booking form link for you.';

                setBookingGuide(null);
                appendBotMessage(
                    `Booking guide completed. ${draftLine}\n\n${bookingGuideSummary(guide)}\n\nClick here: [Open Book Event](${link})\n\n${draft.message || 'Final step: review the computation, complete missing contact/address/MICE fields, tick the acknowledgements, then submit. The booking is only official after BCCC receives and reviews the submitted form.'}`,
                    ['Check availability', 'Payment process', 'Requirements'],
                );
                return true;
            }

            appendBotMessage(
                'Please answer “Yes, prepare it” to open the booking form, or say “change date”, “change package”, or “manual services” to edit the draft.',
                guideSuggestionsFor('confirm'),
            );
            return true;
        }

        return false;
    };

    const submitMessage = async (text: string) => {
        const message = text.trim();

        if (!message || loading) {
            return;
        }

        const now = Date.now();

        if ((spamGuard.mutedUntil ?? 0) > now) {
            setInput('');
            appendBotMessage(mutedMessage(spamGuard.mutedUntil), []);
            return;
        }

        const bypassSpamCheck = Boolean(bookingGuide?.active);

        if (
            !bypassSpamCheck &&
            suspiciousChatMessage(message, spamGuard.recent)
        ) {
            const nextWarnings = Math.min(3, spamGuard.warnings + 1);
            const mutedUntil = nextWarnings >= 3 ? now + spamMuteMs : null;
            const nextGuard: SpamGuardState = {
                warnings: nextWarnings,
                mutedUntil,
                recent: [
                    ...spamGuard.recent.filter(
                        (item) => now - item.at < 60_000,
                    ),
                    { text: message.toLowerCase(), at: now },
                ].slice(-8),
            };

            setSpamGuard(nextGuard);
            setInput('');
            appendBotMessage(
                mutedUntil
                    ? 'Warning 3/3. Chat is disabled for 10 minutes because of repeated spam-like messages. This protects assistant memory and system resources.'
                    : `Warning ${nextWarnings}/3. Please send a clear booking, availability, payment, notification, account, or admin workflow question. After 3 warnings, chat will pause for 10 minutes.`,
                [],
            );
            return;
        }

        setSpamGuard({
            warnings: 0,
            mutedUntil: null,
            recent: [
                ...spamGuard.recent.filter((item) => now - item.at < 60_000),
                { text: message.toLowerCase(), at: now },
            ].slice(-8),
        });

        setInput('');
        setMessages((current) => [
            ...current,
            { id: messageId('user'), role: 'user', text: message },
        ]);

        if (await handleBookingGuideMessage(message)) {
            window.setTimeout(() => inputRef.current?.focus(), 80);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(assistantEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    message,
                    page: currentUrl,
                    context: pageContext,
                    surface,
                    history: messages.slice(-10).map((item) => ({
                        role: item.role,
                        text: item.text,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('Assistant request failed');
            }

            const data = (await response.json()) as AssistantResponse;
            const suggestions = Array.isArray(data.suggestions)
                ? data.suggestions.filter(Boolean).slice(0, 4)
                : [];

            if (suggestions.length > 0) {
                setDynamicSuggestions(suggestions);
            }

            setMessages((current) => [
                ...current,
                {
                    id: messageId('bot'),
                    role: 'bot',
                    mode: data.mode ?? 'local',
                    fallback: data.fallback,
                    confidence: data.confidence,
                    sourceCount: data.source_count,
                    trackingId: data.tracking_id ?? null,
                    text:
                        data.answer ||
                        'I could not find an exact answer. Please check the correct BCCC EASE page for the official latest record.',
                },
            ]);
        } catch {
            setMessages((current) => [
                ...current,
                {
                    id: messageId('bot-error'),
                    role: 'bot',
                    mode: 'local',
                    fallback: true,
                    text: isAdminSurface
                        ? 'I cannot connect right now. Use Dashboard for overview, Bookings for requests, Calendar for schedules, Payment Review for proofs, MICE Registry for reports, and Content/Users for setup. Try again after the connection is restored.'
                        : 'I cannot connect right now. Check Calendar for availability, Book Event for requests, and Notifications/My Bookings for official updates. Try again after the connection is restored.',
                },
            ]);
        } finally {
            setLoading(false);
            window.setTimeout(() => inputRef.current?.focus(), 80);
        }
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void submitMessage(input);
    };

    const resetChat = () => {
        const nextMessages = freshWelcome(role, pageContext);
        const nextSuggestions = starterSuggestionsFor(role);

        setDynamicSuggestions(nextSuggestions);
        setMessages(nextMessages);
        setBookingGuide(null);
        setSpamGuard(defaultSpamGuard());
        saveStoredAssistantChat(
            storageKey,
            role,
            pageContext,
            nextMessages,
            nextSuggestions,
            open,
            null,
            defaultSpamGuard(),
        );
        window.setTimeout(() => inputRef.current?.focus(), 80);
    };

    const markFeedback = async (
        messageIdValue: string,
        trackingId: string,
        helpful: boolean,
    ) => {
        const correction = helpful
            ? ''
            : (window.prompt(
                  'What should the BCCC EASE assistant learn for review? You may leave this blank.',
                  '',
              ) ?? '');

        setMessages((current) =>
            current.map((message) =>
                message.id === messageIdValue
                    ? {
                          ...message,
                          feedback: helpful ? 'helpful' : 'unhelpful',
                      }
                    : message,
            ),
        );

        try {
            await sendAssistantFeedback(trackingId, helpful, correction);
        } catch {
            setMessages((current) =>
                current.map((message) =>
                    message.id === messageIdValue
                        ? { ...message, feedback: undefined }
                        : message,
                ),
            );
        }
    };

    return (
        <div
            className="bccc-client-assistant"
            aria-live="polite"
            data-assistant-surface={surface}
            data-assistant-role={role}
            data-assistant-open={open ? 'true' : 'false'}
        >
            <AnimatePresence>
                {open ? (
                    <motion.section
                        className="bccc-client-assistant-panel"
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 14, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        role="dialog"
                        aria-label="BCCC EASE assistant chat"
                    >
                        <header className="bccc-client-assistant-header">
                            <div className="bccc-client-assistant-avatar">
                                <Bot className="h-4.5 w-4.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                                    {assistantTitle(role)}
                                </p>
                                <p className="truncate text-xs font-medium text-slate-500 dark:text-white/58">
                                    {roleLabel(role)} • {pageContext}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetChat}
                                className="bccc-client-assistant-icon-button"
                                aria-label="Reset assistant conversation"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => persistOpenState(false)}
                                className="bccc-client-assistant-icon-button"
                                aria-label="Close assistant"
                            >
                                <X className="h-4.5 w-4.5" />
                            </button>
                        </header>

                        <div
                            className="bccc-client-assistant-notice"
                            role="note"
                        >
                            Chats are kept for 6 hours. Do not share passwords,
                            OTPs, or payment details.
                        </div>

                        <div className="bccc-client-assistant-messages">
                            {messages.map((message) => (
                                <article
                                    key={message.id}
                                    className={
                                        message.role === 'user'
                                            ? 'bccc-client-chat-row is-user'
                                            : 'bccc-client-chat-row is-bot'
                                    }
                                >
                                    {message.role === 'bot' ? (
                                        <div className="bccc-client-chat-avatar-mini">
                                            <Bot className="h-3.5 w-3.5" />
                                        </div>
                                    ) : null}

                                    <div
                                        className={
                                            message.role === 'user'
                                                ? 'bccc-client-chat-bubble is-user'
                                                : 'bccc-client-chat-bubble is-bot'
                                        }
                                    >
                                        {message.role === 'bot' ? (
                                            <div className="bccc-client-chat-meta">
                                                {assistantMeta(message)}
                                            </div>
                                        ) : null}
                                        <AssistantText text={message.text} />
                                        {message.role === 'bot' &&
                                        message.trackingId ? (
                                            <div className="bccc-client-chat-feedback">
                                                <span>Helpful?</span>
                                                <button
                                                    type="button"
                                                    className={
                                                        message.feedback ===
                                                        'helpful'
                                                            ? 'is-selected'
                                                            : ''
                                                    }
                                                    onClick={() =>
                                                        void markFeedback(
                                                            message.id,
                                                            message.trackingId!,
                                                            true,
                                                        )
                                                    }
                                                    disabled={
                                                        message.feedback ===
                                                        'helpful'
                                                    }
                                                    aria-label="Mark assistant answer as helpful"
                                                >
                                                    {message.feedback ===
                                                    'helpful' ? (
                                                        <Check className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ThumbsUp className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={
                                                        message.feedback ===
                                                        'unhelpful'
                                                            ? 'is-selected'
                                                            : ''
                                                    }
                                                    onClick={() =>
                                                        void markFeedback(
                                                            message.id,
                                                            message.trackingId!,
                                                            false,
                                                        )
                                                    }
                                                    disabled={
                                                        message.feedback ===
                                                        'unhelpful'
                                                    }
                                                    aria-label="Mark assistant answer as not helpful"
                                                >
                                                    <ThumbsDown className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </article>
                            ))}

                            {loading ? (
                                <article className="bccc-client-chat-row is-bot">
                                    <div className="bccc-client-chat-avatar-mini">
                                        <Bot className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="bccc-client-chat-bubble is-bot is-loading">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Checking BCCC EASE records...
                                    </div>
                                </article>
                            ) : null}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="bccc-client-assistant-suggestions">
                            {dynamicSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() =>
                                        void submitMessage(suggestion)
                                    }
                                    disabled={loading}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>

                        <form
                            onSubmit={onSubmit}
                            className="bccc-client-assistant-form"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(event) =>
                                    setInput(event.target.value)
                                }
                                placeholder={assistantPlaceholder(role)}
                                maxLength={4000}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                aria-label="Send message to assistant"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </button>
                        </form>
                    </motion.section>
                ) : null}
            </AnimatePresence>

            <button
                type="button"
                className="bccc-client-assistant-tab"
                onClick={() => persistOpenState(!open)}
                aria-expanded={open}
                aria-label="Open BCCC EASE assistant"
                title="BCCC Assistant"
            >
                <span
                    className="bccc-client-assistant-tab-pulse"
                    aria-hidden="true"
                />
                <span className="bccc-client-assistant-tab-icon">
                    <MessageCircle className="h-5 w-5" />
                </span>
                <span className="bccc-client-assistant-tab-text">
                    {isAdminSurface ? 'Admin Bot' : 'System Bot'}
                    <small>{assistantTabSmallText(role)}</small>
                </span>
            </button>
        </div>
    );
}
