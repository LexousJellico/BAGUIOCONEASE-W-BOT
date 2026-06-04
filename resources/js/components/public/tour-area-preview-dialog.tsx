import {
    TOUR_AREAS,
    TOUR_MEDIA_SPECS,
    TOUR_RELEASE_CHECKLIST,
    type TourArea,
} from '@/data/bccc-tour-areas';
import { Link } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    BadgeCheck,
    Camera,
    ChevronRight,
    Compass,
    FileImage,
    Image,
    MapPinned,
    PlayCircle,
    Route,
    Sparkles,
    UploadCloud,
    X,
    type LucideIcon,
} from 'lucide-react';

type TourAreaPreviewDialogProps = {
    area: TourArea | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const readinessItems: Array<{ label: string; Icon: LucideIcon }> = [
    { label: 'Image slot', Icon: Image },
    { label: 'Tour nodes', Icon: Route },
    { label: 'Area marker', Icon: MapPinned },
];

export default function TourAreaPreviewDialog({
    area,
    open,
    onOpenChange,
}: TourAreaPreviewDialogProps) {
    if (!area) {
        return null;
    }

    const readiness = Math.min(Math.max(area.preview.readiness, 0), 100);
    const areaIndex = Math.max(
        TOUR_AREAS.findIndex((tourArea) => tourArea.id === area.id),
        0,
    );
    const previousArea =
        TOUR_AREAS[(areaIndex - 1 + TOUR_AREAS.length) % TOUR_AREAS.length];
    const nextArea = TOUR_AREAS[(areaIndex + 1) % TOUR_AREAS.length];

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[1200] bg-[#020605]/78 backdrop-blur-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    aria-describedby={`tour-area-preview-description-${area.id}`}
                    className="fixed top-1/2 left-1/2 z-[1201] grid max-h-[calc(100svh-1.5rem)] w-[min(1160px,calc(100vw-1rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-[#f4dfad]/22 bg-[#06110f] text-white shadow-[0_38px_130px_rgba(0,0,0,0.55)] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden"
                >
                    <DialogPrimitive.Close className="absolute top-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/14 bg-black/36 text-white/80 backdrop-blur-xl transition hover:border-[#f4dfad]/45 hover:bg-[#f4dfad] hover:text-[#102a27] focus:ring-2 focus:ring-[#f4dfad]/70 focus:outline-none">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close preview</span>
                    </DialogPrimitive.Close>

                    <div className="relative min-h-[22rem] overflow-hidden bg-[#0b1714] lg:min-h-[42rem]">
                        <img
                            src={area.image}
                            alt={area.label}
                            className="h-full min-h-[22rem] w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.68)),linear-gradient(90deg,rgba(6,17,15,0.16),rgba(6,17,15,0.84))]" />

                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#f4dfad] px-3 py-1.5 text-[10px] font-black tracking-[0.14em] text-[#102a27] uppercase">
                                <Sparkles className="h-3.5 w-3.5" />
                                Coming Soon
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/34 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] text-white uppercase backdrop-blur">
                                <Camera className="h-3.5 w-3.5 text-[#f4dfad]" />
                                360 Ready Slot
                            </span>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                            <p className="text-[10px] font-black tracking-[0.22em] text-[#f4dfad] uppercase">
                                {area.category}
                            </p>
                            <DialogPrimitive.Title className="mt-2 max-w-2xl text-4xl leading-none font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                                {area.label}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description
                                id={`tour-area-preview-description-${area.id}`}
                                className="mt-4 max-w-2xl text-sm leading-7 text-white/76"
                            >
                                {area.preview.lead}
                            </DialogPrimitive.Description>
                        </div>
                    </div>

                    <div className="bg-[radial-gradient(circle_at_top_right,rgba(244,223,173,0.12),transparent_34%),linear-gradient(180deg,#0b1714,#06110f)] p-5 sm:p-7 lg:max-h-[calc(100svh-1.5rem)] lg:overflow-y-auto">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#f4dfad]/22 bg-[#f4dfad]/10 px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-[#f4dfad] uppercase">
                            <PlayCircle className="h-3.5 w-3.5" />
                            Preview popup prepared
                        </div>

                        <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.02em] text-white">
                            {area.preview.headline}
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-white/64">
                            {area.description}
                        </p>

                        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.07] p-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-black tracking-[0.16em] text-white/52 uppercase">
                                    Implementation readiness
                                </span>
                                <span className="rounded-full bg-[#f4dfad] px-2.5 py-1 text-[10px] font-black text-[#102a27]">
                                    {readiness}%
                                </span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full bg-[linear-gradient(90deg,#9fe8dc,#f4dfad)]"
                                    style={{ width: `${readiness}%` }}
                                />
                            </div>
                            <p className="mt-3 text-xs leading-6 font-semibold text-white/58">
                                Structure is ready. Final public release only
                                needs the approved image set and tour capture
                                upload.
                            </p>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {readinessItems.map(({ label, Icon }) => (
                                <div
                                    key={label}
                                    className="rounded-lg border border-white/10 bg-black/18 p-3"
                                >
                                    <Icon className="h-4 w-4 text-[#f4dfad]" />
                                    <p className="mt-2 text-[10px] font-black tracking-[0.14em] text-white/58 uppercase">
                                        {label}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-white">
                                        Prepared
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.055] p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-[#f4dfad] uppercase">
                                    <Route className="h-3.5 w-3.5" />
                                    Route position
                                </div>
                                <span className="rounded-full border border-white/10 bg-black/18 px-2.5 py-1 text-[10px] font-black text-white/52">
                                    {String(areaIndex + 1).padStart(2, '0')} /{' '}
                                    {String(TOUR_AREAS.length).padStart(2, '0')}
                                </span>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                {[
                                    ['Before', previousArea.shortLabel],
                                    ['Current', area.shortLabel],
                                    ['Next', nextArea.shortLabel],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-lg border border-white/10 bg-black/18 p-3"
                                    >
                                        <p className="text-[9px] font-black tracking-[0.14em] text-white/42 uppercase">
                                            {label}
                                        </p>
                                        <p className="mt-1 text-sm font-black text-white">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-[#f4dfad] uppercase">
                                    <Compass className="h-3.5 w-3.5" />
                                    Viewer connection
                                </div>
                                <div className="mt-3 grid gap-3">
                                    <p className="rounded-lg border border-white/10 bg-black/18 p-3 text-xs leading-6 font-semibold text-white/66">
                                        {area.captureNote}
                                    </p>
                                    <p className="rounded-lg border border-white/10 bg-black/18 p-3 text-xs leading-6 font-semibold text-white/66">
                                        {area.layoutNote}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-[#f4dfad] uppercase">
                                    <FileImage className="h-3.5 w-3.5" />
                                    Upload suggestions
                                </div>
                                <div className="mt-3 space-y-2">
                                    {TOUR_MEDIA_SPECS.slice(0, 3).map(
                                        (spec) => (
                                            <div
                                                key={spec.title}
                                                className="rounded-lg border border-white/10 bg-black/18 p-3"
                                            >
                                                <p className="text-xs font-black text-white">
                                                    {spec.title}
                                                </p>
                                                <p className="mt-1 text-xs leading-5 font-semibold text-white/58">
                                                    {spec.detail}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.055] p-4">
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-[#f4dfad] uppercase">
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Launch essentials
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {TOUR_RELEASE_CHECKLIST.slice(0, 2).map(
                                    (item) => (
                                        <div
                                            key={item.title}
                                            className="rounded-lg border border-white/10 bg-black/18 p-3"
                                        >
                                            <p className="text-xs font-black text-white">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 text-xs leading-5 font-semibold text-white/58">
                                                {item.detail}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-5 lg:grid-cols-2">
                            <section>
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-[#f4dfad] uppercase">
                                    <Route className="h-3.5 w-3.5" />
                                    Tour route preview
                                </div>
                                <ol className="mt-3 space-y-2">
                                    {area.preview.routeNodes.map(
                                        (node, index) => (
                                            <li
                                                key={node}
                                                className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.055] p-3"
                                            >
                                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f4dfad] text-[10px] font-black text-[#102a27]">
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm leading-6 font-semibold text-white/72">
                                                    {node}
                                                </span>
                                            </li>
                                        ),
                                    )}
                                </ol>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-[#f4dfad] uppercase">
                                    <UploadCloud className="h-3.5 w-3.5" />
                                    Needed media
                                </div>
                                <div className="mt-3 space-y-2">
                                    {area.preview.mediaNeeds.map((need) => (
                                        <div
                                            key={need}
                                            className="flex gap-3 rounded-lg border border-white/10 bg-black/18 p-3"
                                        >
                                            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9fe8dc]" />
                                            <span className="text-sm leading-6 font-semibold text-white/68">
                                                {need}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row">
                            <Link
                                href="/facilities"
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#f4dfad] px-5 text-[11px] font-black tracking-[0.14em] text-[#102a27] uppercase transition hover:bg-white"
                            >
                                View current facilities
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                            <DialogPrimitive.Close className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-white/16 bg-white/8 px-5 text-[11px] font-black tracking-[0.14em] text-white uppercase transition hover:bg-white/14">
                                Keep browsing
                            </DialogPrimitive.Close>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
