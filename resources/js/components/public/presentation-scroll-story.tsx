import SafeImage from '@/components/system/safe-image';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { useMemo, useRef } from 'react';
import type { FeaturePackageItem, PublicSpaceItem } from '@/types/public-content';

type Props = {
    spaces?: PublicSpaceItem[];
    packages?: FeaturePackageItem[];
};

type StoryItem = {
    title: string;
    caption: string;
    image: string;
    meta: string;
    href: string;
};

const fallbackItems: StoryItem[] = [
    {
        title: 'Full Hall',
        caption: 'A formal event canvas for ceremonies, conferences, and government-scale gatherings.',
        image: '/marketing/images/events/darkmain.JPG',
        meta: 'Signature venue',
        href: '/facilities',
    },
    {
        title: 'Main Hall + VIP Lounge',
        caption: 'A premium package for programs that need a main floor and a private reception space.',
        image: '/marketing/images/facilities/darkvip.JPG',
        meta: 'Package ready',
        href: '/book?package=MAIN_VIP',
    },
    {
        title: 'Main Hall + Board Room',
        caption: 'Balanced for plenary sessions, technical panels, and smaller executive meetings.',
        image: '/marketing/images/events/4.jpg',
        meta: 'Meeting flow',
        href: '/book?package=MAIN_BOARD',
    },
    {
        title: 'LED Wall Add-on',
        caption: 'Designed for high-visibility presentations, launches, and public-facing programs.',
        image: '/marketing/images/events/darkmain.JPG',
        meta: 'Visual add-on',
        href: '/book?package=MAIN_LED',
    },
];

function resolveImage(item: Partial<PublicSpaceItem | FeaturePackageItem>, fallback: string) {
    return item.imageUrl ?? item.image_url ?? item.image ?? item.darkImage ?? item.dark_image ?? item.thumbnail ?? item.thumbnail_url ?? fallback;
}

function packageTitle(item: FeaturePackageItem) {
    return item.title || item.subtitle || item.code || 'Venue Package';
}

function packageCaption(item: FeaturePackageItem) {
    return item.summary || item.description || item.subtitle || 'A suggested venue combination prepared for faster reservation review.';
}

function packageHref(item: FeaturePackageItem) {
    return item.href || item.url || (item.code ? `/book?package=${encodeURIComponent(item.code)}` : '/book');
}

function spaceTitle(item: PublicSpaceItem) {
    return item.title || item.name || 'Venue Space';
}

function spaceCaption(item: PublicSpaceItem) {
    return item.summary || item.shortDescription || item.short_description || item.description || 'Explore a BCCC venue space prepared for public and private programs.';
}

function spaceHref(item: PublicSpaceItem) {
    return item.href || (item.slug ? `/facilities/${item.slug}` : '/facilities');
}

export default function PresentationScrollStory({ spaces = [], packages = [] }: Props) {
    const reduceMotion = useReducedMotion();
    const ref = useRef<HTMLElement | null>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const layerY = useTransform(scrollYProgress, [0, 1], ['3rem', '-3rem']);
    const imageRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-4, 0, 4]);

    const items = useMemo<StoryItem[]>(() => {
        const packageStories = packages.slice(0, 3).map((item, index) => ({
            title: packageTitle(item),
            caption: packageCaption(item),
            image: resolveImage(item, fallbackItems[index]?.image ?? '/marketing/images/events/darkmain.JPG'),
            meta: item.priceLabel ?? item.price_label ?? item.rateLabel ?? item.rate_label ?? 'Suggested package',
            href: packageHref(item),
        }));

        const spaceStories = spaces.slice(0, 4 - packageStories.length).map((item, index) => ({
            title: spaceTitle(item),
            caption: spaceCaption(item),
            image: resolveImage(item, fallbackItems[index + packageStories.length]?.image ?? '/marketing/images/facilities/darkvip.JPG'),
            meta: item.capacity ? `${item.capacity} capacity` : item.category || 'Venue space',
            href: spaceHref(item),
        }));

        const merged = [...packageStories, ...spaceStories];
        return merged.length >= 4 ? merged.slice(0, 4) : [...merged, ...fallbackItems].slice(0, 4);
    }, [packages, spaces]);

    const featured = items[0] ?? fallbackItems[0];

    return (
        <section ref={ref} className="bccc-presentation-story public-section" aria-labelledby="bccc-presentation-heading">
            <motion.div style={reduceMotion ? undefined : { y: layerY }} className="bccc-presentation-bg-word" aria-hidden="true">
                EASE
            </motion.div>

            <div className="bccc-presentation-shell">
                <div className="bccc-presentation-copy">
                    <p className="bccc-presentation-kicker"><Sparkles className="h-4 w-4" /> Cinematic booking flow</p>
                    <h2 id="bccc-presentation-heading">Scroll through the venue like a presentation.</h2>
                    <p>
                        The public site now feels closer to the sample landing animation: large editorial text, layered media, dark contrast panels, and clear routes into reservation-ready packages.
                    </p>
                    <div className="bccc-presentation-actions">
                        <Link href="/book" className="bccc-presentation-primary">
                            Start booking <ArrowUpRight className="h-4 w-4" />
                        </Link>
                        <Link href="/calendar" className="bccc-presentation-secondary">
                            <CalendarDays className="h-4 w-4" /> Check calendar
                        </Link>
                    </div>
                </div>

                <div className="bccc-presentation-board">
                    <div className="bccc-presentation-list" role="list">
                        {items.map((item, index) => (
                            <Link href={item.href} key={`${item.title}-${index}`} className="bccc-presentation-row" role="listitem">
                                <span>{String(index + 1).padStart(2, '0')}</span>
                                <strong>{item.title}</strong>
                                <small>{item.meta}</small>
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        ))}
                    </div>

                    <motion.div style={reduceMotion ? undefined : { rotate: imageRotate }} className="bccc-presentation-floating-card">
                        <SafeImage src={featured.image} fallbackSrc="/marketing/images/facilities/darkvip.JPG" alt={featured.title} className="h-full w-full object-cover" />
                        <div className="bccc-presentation-floating-shade" />
                        <div className="bccc-presentation-floating-copy">
                            <span><MapPin className="h-3.5 w-3.5" /> Baguio Convention and Cultural Center</span>
                            <strong>{featured.title}</strong>
                            <p>{featured.caption}</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
