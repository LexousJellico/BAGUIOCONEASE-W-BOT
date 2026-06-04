import { ImageOff } from 'lucide-react';
import { type ImgHTMLAttributes, useEffect, useMemo, useState } from 'react';

export const DEFAULT_PUBLIC_IMAGE = '/marketing/images/events/default.png';

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    src?: string | null;
    fallbackSrc?: string;
    fallbackLabel?: string;
    wrapperClassName?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function normalizeStoragePath(value: string) {
    let clean = value.replace(/\\/g, '/').replace(/\?.*$/, '');

    if (clean.startsWith('/marketing/') || clean.startsWith('/images/')) {
        return clean;
    }

    if (clean.startsWith('marketing/') || clean.startsWith('images/')) {
        return `/${clean}`;
    }

    if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:')) {
        return clean;
    }

    if (clean.includes('/storage/app/public/')) {
        clean = clean.replace(/^.*?\/storage\/app\/public\//, '');
    }

    clean = clean
        .replace(/^\/?storage\/app\/public\//, '')
        .replace(/^\/?app\/public\//, '')
        .replace(/^\/?public\/storage\//, '')
        .replace(/^\/?storage\//, '')
        .replace(/^\/?public\//, '');

    if (clean.startsWith('/')) {
        return clean;
    }

    return `/storage/app/public/${clean}`;
}

function alternateLaravelStoragePath(value: string) {
    if (value.startsWith('/storage/app/public/')) {
        return value.replace(/^\/storage\/app\/public\//, '/storage/');
    }

    if (value.startsWith('/storage/')) {
        return value.replace(/^\/storage\//, '/storage/app/public/');
    }

    return '';
}

export function normalizeImageSrc(value?: string | null, fallback = DEFAULT_PUBLIC_IMAGE) {
    const raw = String(value || '').trim();

    if (!raw) {
        return fallback;
    }

    return normalizeStoragePath(raw);
}

export default function SafeImage({
    src,
    fallbackSrc = DEFAULT_PUBLIC_IMAGE,
    fallbackLabel = 'Image unavailable',
    wrapperClassName,
    className,
    alt = '',
    ...props
}: SafeImageProps) {
    const resolvedInitialSrc = useMemo(() => normalizeImageSrc(src, fallbackSrc), [src, fallbackSrc]);
    const resolvedFallback = useMemo(() => normalizeImageSrc(fallbackSrc, DEFAULT_PUBLIC_IMAGE), [fallbackSrc]);
    const [currentSrc, setCurrentSrc] = useState(resolvedInitialSrc);
    const [triedAlternate, setTriedAlternate] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setCurrentSrc(resolvedInitialSrc);
        setTriedAlternate(false);
        setFailed(false);
    }, [resolvedInitialSrc]);

    const handleError = () => {
        const alternate = alternateLaravelStoragePath(currentSrc);

        if (!triedAlternate && alternate) {
            setCurrentSrc(alternate);
            setTriedAlternate(true);
            return;
        }

        if (currentSrc !== resolvedFallback) {
            setCurrentSrc(resolvedFallback);
            setTriedAlternate(true);
            setFailed(false);
            return;
        }

        setFailed(true);
    };

    if (failed) {
        return (
            <div
                className={cx(
                    'grid h-full min-h-[10rem] w-full place-items-center border border-dashed border-black/15 bg-slate-100 text-center text-slate-500 dark:border-white/15 dark:bg-white/7 dark:text-white/50',
                    wrapperClassName,
                )}
            >
                <div>
                    <ImageOff className="mx-auto h-7 w-7" />
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em]">{fallbackLabel}</p>
                </div>
            </div>
        );
    }

    return <img {...props} src={currentSrc} alt={alt} className={className} onError={handleError} draggable={props.draggable ?? false} />;
}