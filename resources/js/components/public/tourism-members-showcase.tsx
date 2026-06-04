import SafeImage from '@/components/system/safe-image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type TourismRecord = {
    id?: number | string;
    fullName?: string | null;
    full_name?: string | null;
    name?: string | null;
    title?: string | null;
    designation?: string | null;
    position?: string | null;
    role?: string | null;
    officeSection?: string | null;
    office_section?: string | null;
    unitName?: string | null;
    unit_name?: string | null;
    teamLabel?: string | null;
    team_label?: string | null;
    treeLevel?: number | string | null;
    tree_level?: number | string | null;
    shortBio?: string | null;
    short_bio?: string | null;
    bio?: string | null;
    description?: string | null;
    message?: string | null;
    details?: string[] | string | null;
    detailsText?: string | null;
    details_text?: string | null;
    photo?: string | null;
    photoUrl?: string | null;
    photo_url?: string | null;
    photoPath?: string | null;
    photo_path?: string | null;
    image?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    imagePath?: string | null;
    image_path?: string | null;
    active?: boolean | number | string | null;
    is_active?: boolean | number | string | null;
    featured?: boolean | number | string | null;
    is_featured?: boolean | number | string | null;
    email?: string | null;
    phone?: string | null;
    sortOrder?: number | string | null;
    sort_order?: number | string | null;
};

type Props = {
    items?: TourismRecord[];
};

type StageState = {
    x: number;
    y: number;
    scale: number;
    opacity: number;
    zIndex: number;
    rotate: number;
    blur: number;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function hidden(value: unknown) {
    return value === false || value === 0 || value === '0' || value === 'false';
}

function truthy(value: unknown) {
    return value === true || value === 1 || value === '1' || value === 'true';
}

function text(value: unknown, fallback = '') {
    if (value === null || value === undefined) return fallback;

    return String(value).trim() || fallback;
}

function nameOf(item: TourismRecord) {
    return text(
        item.fullName || item.full_name || item.name || item.title,
        'CTCAO Member',
    );
}

function positionOf(item: TourismRecord) {
    return text(
        item.designation || item.position || item.role,
        'City Tourism, Culture and Arts Office',
    );
}

function sectionOf(item: TourismRecord) {
    return text(
        item.officeSection ||
            item.office_section ||
            item.teamLabel ||
            item.team_label ||
            item.unitName ||
            item.unit_name,
        'CTCAO',
    );
}

function photoOf(item: TourismRecord) {
    return text(
        item.photo ||
            item.photoUrl ||
            item.photo_url ||
            item.photoPath ||
            item.photo_path ||
            item.image ||
            item.imageUrl ||
            item.image_url ||
            item.imagePath ||
            item.image_path,
        '',
    );
}

function messageOf(item: TourismRecord) {
    const raw =
        item.message ||
        item.shortBio ||
        item.short_bio ||
        item.bio ||
        item.description ||
        item.details ||
        item.detailsText ||
        item.details_text;

    if (Array.isArray(raw)) {
        return raw
            .map((line) => text(line))
            .filter(Boolean)
            .join('\n');
    }

    return text(
        raw,
        'This CTCAO team member supports tourism, culture, arts, creative-city programs, event coordination, and public service assistance for Baguio City.',
    );
}

function detailsLinesOf(item: TourismRecord) {
    const raw = item.details || item.detailsText || item.details_text;

    if (Array.isArray(raw)) {
        return raw.map((line) => text(line)).filter(Boolean);
    }

    return text(raw)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
}

function levelOf(item: TourismRecord) {
    const value = Number(item.treeLevel ?? item.tree_level ?? 99);

    return Number.isFinite(value) ? value : 99;
}

function sortOrderOf(item: TourismRecord) {
    const value = Number(item.sortOrder ?? item.sort_order ?? 9999);

    return Number.isFinite(value) ? value : 9999;
}

function normalizeMembers(items: TourismRecord[]) {
    return items
        .filter((item) => !hidden(item.active) && !hidden(item.is_active))
        .sort((a, b) => {
            if (truthy(a.featured) !== truthy(b.featured))
                return truthy(a.featured) ? -1 : 1;
            if (truthy(a.is_featured) !== truthy(b.is_featured))
                return truthy(a.is_featured) ? -1 : 1;
            if (levelOf(a) !== levelOf(b)) return levelOf(a) - levelOf(b);
            if (sortOrderOf(a) !== sortOrderOf(b))
                return sortOrderOf(a) - sortOrderOf(b);

            return nameOf(a).localeCompare(nameOf(b));
        });
}

function mod(value: number, total: number) {
    return ((value % total) + total) % total;
}

function signedOffset(index: number, active: number, total: number) {
    const raw = index - active;

    if (raw > total / 2) return raw - total;
    if (raw < -total / 2) return raw + total;

    return raw;
}

function stageState(
    index: number,
    active: number,
    total: number,
    reducedMotion: boolean,
): StageState {
    const offset = signedOffset(index, active, total);

    const map: Record<number, StageState> = {
        [-4]: {
            x: -470,
            y: 46,
            scale: 0.52,
            opacity: 0.04,
            zIndex: 1,
            rotate: -1.5,
            blur: 2,
        },
        [-3]: {
            x: -372,
            y: 40,
            scale: 0.6,
            opacity: 0.12,
            zIndex: 2,
            rotate: -1.2,
            blur: 1.4,
        },
        [-2]: {
            x: -270,
            y: 31,
            scale: 0.72,
            opacity: 0.34,
            zIndex: 8,
            rotate: -0.8,
            blur: 0.7,
        },
        [-1]: {
            x: -145,
            y: 16,
            scale: 0.88,
            opacity: 0.82,
            zIndex: 18,
            rotate: -0.35,
            blur: 0,
        },
        [0]: {
            x: 0,
            y: -5,
            scale: 1.05,
            opacity: 1,
            zIndex: 40,
            rotate: 0,
            blur: 0,
        },
        [1]: {
            x: 145,
            y: 16,
            scale: 0.88,
            opacity: 0.82,
            zIndex: 18,
            rotate: 0.35,
            blur: 0,
        },
        [2]: {
            x: 270,
            y: 31,
            scale: 0.72,
            opacity: 0.34,
            zIndex: 8,
            rotate: 0.8,
            blur: 0.7,
        },
        [3]: {
            x: 372,
            y: 40,
            scale: 0.6,
            opacity: 0.12,
            zIndex: 2,
            rotate: 1.2,
            blur: 1.4,
        },
        [4]: {
            x: 470,
            y: 46,
            scale: 0.52,
            opacity: 0.04,
            zIndex: 1,
            rotate: 1.5,
            blur: 2,
        },
    };

    const state = map[offset] ?? {
        x: offset * 108,
        y: 52,
        scale: 0.46,
        opacity: 0,
        zIndex: 0,
        rotate: 0,
        blur: 3,
    };

    if (!reducedMotion) {
        return state;
    }

    return {
        ...state,
        rotate: 0,
        blur: 0,
        y: offset === 0 ? -4 : 18,
    };
}

function splitName(name: string) {
    const clean = name.trim();
    const quotedMatch = clean.match(/^(.*?)(".*?")(.*)$/);

    if (quotedMatch) {
        return [
            quotedMatch[1].trim(),
            `${quotedMatch[2]} ${quotedMatch[3]}`.trim(),
        ].filter(Boolean);
    }

    const parts = clean.split(/\s+/);

    if (parts.length <= 2) return [clean];

    const midpoint = Math.ceil(parts.length / 2);

    return [
        parts.slice(0, midpoint).join(' '),
        parts.slice(midpoint).join(' '),
    ];
}

function EmptyPanel() {
    return (
        <section className="bg-[#e8eef1] px-4 py-14 sm:px-6 lg:px-8 dark:bg-[#07110f]">
            <div className="mx-auto grid max-w-5xl place-items-center rounded-xl border border-dashed border-[#176456]/25 bg-white/60 p-8 text-center shadow-[0_18px_55px_rgba(8,47,42,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
                <UsersRound className="h-9 w-9 text-[#176456] dark:text-[#9fe8dc]" />
                <h3 className="mt-4 text-2xl font-bold tracking-normal text-[#153d66] dark:text-white">
                    No CTCAO team profiles yet
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#425466] dark:text-white/60">
                    Add active Tourism Office members in the Content Manager.
                </p>
            </div>
        </section>
    );
}

function TeamImage({
    member,
    className,
}: {
    member: TourismRecord;
    className?: string;
}) {
    const src = photoOf(member);

    if (!src) {
        return (
            <div
                className={cx(
                    'grid h-full w-full place-items-center bg-[#dfe9ea] text-[#176456] dark:bg-white/10 dark:text-[#9fe8dc]',
                    className,
                )}
            >
                <div className="grid h-16 w-16 place-items-center rounded-full border border-[#176456]/15 bg-white/65 shadow-[0_12px_30px_rgba(21,61,102,0.12)]">
                    <UserRound className="h-8 w-8" />
                </div>
            </div>
        );
    }

    return (
        <SafeImage
            src={src}
            fallbackSrc="/marketing/images/events/default.png"
            alt={nameOf(member)}
            className={cx(
                'h-full w-full object-contain object-top p-1.5',
                className,
            )}
            wrapperClassName="h-full w-full rounded-none border-0"
        />
    );
}

function ReferenceCard({
    member,
    active,
    onSelect,
}: {
    member: TourismRecord;
    active: boolean;
    onSelect: () => void;
}) {
    const lines = splitName(nameOf(member));

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cx(
                'group flex h-[25rem] w-[16.5rem] flex-col overflow-hidden rounded-[3px] border bg-[#edf3f5] text-center shadow-[0_18px_50px_rgba(21,61,102,0.12)] transition focus:ring-2 focus:ring-[#176456] focus:outline-none dark:border-white/10 dark:bg-white/[0.055]',
                active ? 'border-[#176456]/35' : 'border-[#c6d4d7]/80',
            )}
        >
            <div className="px-5 pt-6 pb-5">
                <p className="min-h-5 truncate text-[11px] font-black tracking-[0.09em] text-[#334357] uppercase dark:text-white/72">
                    {sectionOf(member)}
                </p>

                <p className="mt-2 line-clamp-1 text-[11px] font-black tracking-[0.06em] text-[#176456] uppercase dark:text-[#9fe8dc]">
                    {positionOf(member)}
                </p>

                <div className="mx-auto mt-5 aspect-[3/4] h-[13.75rem] w-auto max-w-full overflow-hidden rounded-[3px] border border-white/80 bg-white shadow-[0_12px_30px_rgba(21,61,102,0.10)] dark:border-white/10 dark:bg-white/[0.08]">
                    <TeamImage
                        member={member}
                        className="transition duration-500 group-hover:scale-105"
                    />
                </div>

                <div className="mt-5 flex min-h-[4.5rem] flex-col items-center justify-center">
                    {lines.map((line) => (
                        <span
                            key={line}
                            className={cx(
                                'block leading-[1.02] font-black tracking-normal text-[#17243a] uppercase dark:text-white',
                                active ? 'text-[25px]' : 'text-[20px]',
                            )}
                        >
                            {line}
                        </span>
                    ))}
                </div>

                {active ? (
                    <span className="mt-2 inline-flex items-center justify-center gap-2 text-[12px] font-bold text-[#176456] transition group-hover:gap-3 dark:text-[#9fe8dc]">
                        View Profile <ArrowRight className="h-4 w-4" />
                    </span>
                ) : null}
            </div>
        </button>
    );
}

function MobileCard({
    member,
    onSelect,
}: {
    member: TourismRecord;
    onSelect: () => void;
}) {
    const lines = splitName(nameOf(member));

    return (
        <button
            type="button"
            onClick={onSelect}
            className="w-[min(18rem,calc(100vw-2rem))] shrink-0 snap-center overflow-hidden rounded-[4px] border border-[#176456]/16 bg-[#edf3f5] text-center shadow-[0_18px_45px_rgba(21,61,102,0.10)] dark:border-white/10 dark:bg-white/[0.055]"
        >
            <div className="p-5">
                <p className="truncate text-[11px] font-black tracking-[0.09em] text-[#334357] uppercase dark:text-white/72">
                    {sectionOf(member)}
                </p>
                <p className="mt-2 truncate text-[11px] font-black tracking-[0.06em] text-[#176456] uppercase dark:text-[#9fe8dc]">
                    {positionOf(member)}
                </p>

                <div className="mx-auto mt-4 aspect-[3/4] h-[13.5rem] max-w-full overflow-hidden rounded-[3px] border border-white/80 bg-white dark:border-white/10 dark:bg-white/[0.08]">
                    <TeamImage member={member} />
                </div>

                <div className="mt-5 min-h-[4rem]">
                    {lines.map((line) => (
                        <span
                            key={line}
                            className="block text-[22px] leading-none font-black tracking-normal text-[#17243a] uppercase dark:text-white"
                        >
                            {line}
                        </span>
                    ))}
                </div>

                <span className="mt-4 inline-flex items-center justify-center gap-2 text-[12px] font-bold text-[#176456] dark:text-[#9fe8dc]">
                    View Profile <ArrowRight className="h-4 w-4" />
                </span>
            </div>
        </button>
    );
}

function ProfileDetail({
    member,
    onBack,
}: {
    member: TourismRecord;
    onBack: () => void;
}) {
    const lines = messageOf(member)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    const detailLines = detailsLinesOf(member);

    return (
        <motion.div
            key="profile-detail"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden bg-[#e8eef1] dark:bg-[#07110f]"
        >
            <div className="relative mx-auto max-w-[1420px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-bold text-[#176456] transition hover:bg-[#176456]/10 dark:text-[#9fe8dc] dark:hover:bg-white/10"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go back
                </button>

                <div className="mt-8 grid gap-8 lg:grid-cols-[0.48fr_1fr] lg:items-start">
                    <div className="mx-auto w-full max-w-[23rem] overflow-hidden rounded-[6px] bg-white shadow-[0_20px_60px_rgba(21,61,102,0.12)] ring-1 ring-[#176456]/14 lg:max-w-none dark:bg-white/[0.055] dark:ring-white/10">
                        <div className="aspect-[3/4]">
                            <TeamImage member={member} />
                        </div>
                    </div>

                    <div className="pt-1 lg:pt-2">
                        <p className="text-[12px] font-black tracking-[0.16em] text-[#176456] uppercase dark:text-[#9fe8dc]">
                            {sectionOf(member)}
                        </p>

                        <h2 className="mt-3 max-w-5xl text-4xl leading-[1.05] font-bold tracking-normal text-[#174f5f] md:text-5xl dark:text-white">
                            {nameOf(member)}
                        </h2>

                        <p className="mt-3 text-base font-semibold tracking-[0.02em] text-[#243246] uppercase dark:text-white/80">
                            {positionOf(member)}
                        </p>

                        <div className="mt-9">
                            <p className="text-sm font-semibold tracking-[0.08em] text-[#8b98a4] uppercase dark:text-white/45">
                                Message
                            </p>

                            <div className="mt-3 space-y-3 text-base leading-8 text-[#1d2d3f] dark:text-white/74">
                                {lines.map((line) => (
                                    <p key={line}>{line}</p>
                                ))}
                            </div>
                        </div>

                        {detailLines.length ? (
                            <div className="mt-10">
                                <p className="text-sm font-semibold tracking-[0.08em] text-[#8b98a4] uppercase dark:text-white/45">
                                    Responsibilities
                                </p>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {detailLines.map((line) => (
                                        <div
                                            key={line}
                                            className="border-l-4 border-[#176456] bg-white/60 px-4 py-3 text-sm leading-7 text-[#1d2d3f] shadow-[0_12px_26px_rgba(21,61,102,0.06)] dark:border-[#9fe8dc] dark:bg-white/[0.055] dark:text-white/72"
                                        >
                                            {line}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function TourismMembersShowcase({ items = [] }: Props) {
    const members = useMemo(
        () => normalizeMembers(Array.isArray(items) ? items : []),
        [items],
    );
    const [active, setActive] = useState(0);
    const [selected, setSelected] = useState<TourismRecord | null>(null);
    const reducedMotion = Boolean(useReducedMotion());

    if (members.length === 0) {
        return <EmptyPanel />;
    }

    const activeIndex = mod(active, members.length);

    function previous() {
        setActive((value) => mod(value - 1, members.length));
    }

    function next() {
        setActive((value) => mod(value + 1, members.length));
    }

    function choose(index: number) {
        const normalized = mod(index, members.length);

        if (normalized === activeIndex) {
            setSelected(members[normalized]);
            return;
        }

        setActive(normalized);
    }

    return (
        <section className="relative overflow-hidden bg-[#e8eef1] text-[#153d66] dark:bg-[#07110f] dark:text-white">
            <AnimatePresence mode="wait">
                {selected ? (
                    <ProfileDetail
                        member={selected}
                        onBack={() => setSelected(null)}
                    />
                ) : (
                    <motion.div
                        key="team-carousel"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="relative px-0 py-10 lg:py-12"
                    >
                        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                            <h2 className="text-4xl leading-tight font-bold tracking-normal text-[#174f5f] md:text-5xl dark:text-white">
                                Tourism Office Team
                            </h2>

                            <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-[#243246] dark:text-white/65">
                                Meet the City Tourism, Culture and Arts Office
                                team serving Baguio City tourism, culture,
                                creative-city coordination, and event
                                assistance.
                            </p>
                        </div>

                        <div className="relative mt-8 md:hidden">
                            <div
                                className={cx(
                                    'flex snap-x gap-4 overflow-x-auto px-4 pb-5 [scrollbar-width:none] sm:px-6',
                                    members.length === 1 && 'justify-center',
                                )}
                            >
                                {members.map((member) => (
                                    <MobileCard
                                        key={member.id ?? nameOf(member)}
                                        member={member}
                                        onSelect={() => setSelected(member)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="relative mt-8 hidden min-h-[32rem] overflow-hidden md:block">
                            <div className="relative mx-auto h-[27.5rem] max-w-[1040px]">
                                {members.map((member, index) => {
                                    const state = stageState(
                                        index,
                                        activeIndex,
                                        members.length,
                                        reducedMotion,
                                    );

                                    return (
                                        <motion.div
                                            key={
                                                member.id ??
                                                `${nameOf(member)}-${index}`
                                            }
                                            className="absolute top-4 left-1/2 origin-center"
                                            animate={{
                                                x: state.x,
                                                y: state.y,
                                                scale: state.scale,
                                                opacity: state.opacity,
                                                rotate: state.rotate,
                                                filter: `blur(${state.blur}px)`,
                                            }}
                                            transition={{
                                                type: reducedMotion
                                                    ? false
                                                    : 'spring',
                                                stiffness: 110,
                                                damping: 25,
                                                mass: 0.86,
                                            }}
                                            style={{
                                                zIndex: state.zIndex,
                                                marginLeft: '-8.25rem',
                                            }}
                                        >
                                            <ReferenceCard
                                                member={member}
                                                active={index === activeIndex}
                                                onSelect={() => choose(index)}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <div className="relative z-40 -mt-6 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={previous}
                                    className="grid h-10 w-10 place-items-center rounded-full bg-[#176456] text-white shadow-[0_12px_30px_rgba(23,100,86,0.24)] transition hover:-translate-y-0.5 hover:bg-[#21836f]"
                                    aria-label="Previous CTCAO member"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={next}
                                    className="grid h-10 w-10 place-items-center rounded-full bg-[#176456] text-white shadow-[0_12px_30px_rgba(23,100,86,0.24)] transition hover:-translate-y-0.5 hover:bg-[#21836f]"
                                    aria-label="Next CTCAO member"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="relative z-40 mt-4 flex justify-center gap-2">
                                {members.map((member, index) => (
                                    <button
                                        key={
                                            member.id ??
                                            `${nameOf(member)}-dot-${index}`
                                        }
                                        type="button"
                                        onClick={() => choose(index)}
                                        className={cx(
                                            'h-1.5 rounded-full transition-all',
                                            index === activeIndex
                                                ? 'w-7 bg-[#176456]'
                                                : 'w-1.5 bg-[#176456]/25 dark:bg-white/25',
                                        )}
                                        aria-label={`Show ${nameOf(member)}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
