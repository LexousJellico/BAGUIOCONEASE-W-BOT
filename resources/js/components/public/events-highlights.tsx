import { Link } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Film,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PublicEventItem } from '@/types/public-content';

type Props = {
  items?: PublicEventItem[];
  pageMode?: boolean;
};

type ScopeKey = 'bccc' | 'city';

const AUTO_ADVANCE_MS = 5600;
const easeLuxury = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function wrap(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}

function offsetFor(index: number, active: number, length: number) {
  if (length <= 1) {
    return 0;
  }

  let diff = index - active;
  const half = Math.floor(length / 2);

  if (diff > half) {
    diff -= length;
  }

  if (diff < -half) {
    diff += length;
  }

  return diff;
}

function eventImage(item: PublicEventItem, dark = false) {
  if (dark) {
    return item.darkImage || item.image || item.images?.[0] || '/marketing/images/events/darkmain.JPG';
  }

  return item.lightImage || item.image || item.images?.[0] || '/marketing/images/events/lightmain.JPG';
}

function eventRange(item: PublicEventItem) {
  if (item.dateEnd && item.dateEnd !== item.date) {
    return `${item.date} — ${item.dateEnd}`;
  }

  return item.date;
}

function EventMeta({ item }: { item: PublicEventItem }) {
  return (
    <div className="bccc-film-meta">
      <span>
        <CalendarDays className="h-3.5 w-3.5" />
        {eventRange(item)}
      </span>
      {item.time ? (
        <span>
          <Clock3 className="h-3.5 w-3.5" />
          {item.time}
        </span>
      ) : null}
      <span>
        <MapPin className="h-3.5 w-3.5" />
        {item.venue || 'BCCC'}
      </span>
    </div>
  );
}

function ScopeToggle({
  tab,
  setTab,
  bcccCount,
  cityCount,
}: {
  tab: ScopeKey;
  setTab: (value: ScopeKey) => void;
  bcccCount: number;
  cityCount: number;
}) {
  const options = [
    { value: 'bccc' as const, label: 'BCCC Events', count: bcccCount },
    { value: 'city' as const, label: 'Baguio City Events', count: cityCount },
  ];

  return (
    <div className="bccc-film-toggle" role="tablist" aria-label="Event categories">
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={tab === item.value}
          className={cx(tab === item.value && 'is-active')}
          onClick={() => setTab(item.value)}
        >
          {item.label}
          <span>{item.count}</span>
        </button>
      ))}
    </div>
  );
}

function FilmCarousel({ items }: { items: PublicEventItem[] }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const activeEvent = items[active];

  useEffect(() => {
    setActive(0);
  }, [items]);

  useEffect(() => {
    if (items.length <= 1 || reduceMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((value) => wrap(value + 1, items.length));
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [items.length, reduceMotion]);

  if (!activeEvent) {
    return (
      <div className="bccc-public-empty-panel dark-panel">
        No public events are available in this category yet.
      </div>
    );
  }

  return (
    <div className="bccc-film-stage">
      <div className="bccc-film-perforation is-top" aria-hidden="true" />
      <div className="bccc-film-perforation is-bottom" aria-hidden="true" />

      <div className="bccc-film-viewport" aria-live="polite">
        {items.map((item, index) => {
          const offset = offsetFor(index, active, items.length);
          const visible = Math.abs(offset) <= 2;

          if (!visible) {
            return null;
          }

          return (
            <motion.button
              key={item.id}
              type="button"
              className={cx('bccc-film-card', offset === 0 && 'is-active')}
              aria-label={`View event ${item.title}`}
              onClick={() => setActive(index)}
              initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.92 }}
              animate={{
                opacity: Math.abs(offset) === 2 ? 0.38 : offset === 0 ? 1 : 0.68,
                x: `${offset * 46}%`,
                y: Math.abs(offset) * 18,
                scale: offset === 0 ? 1 : 0.78,
                zIndex: 10 - Math.abs(offset),
                filter: offset === 0 ? 'blur(0px)' : 'blur(1.5px)',
              }}
              transition={{ duration: 0.72, ease: easeLuxury }}
            >
              <img src={eventImage(item, false)} alt={item.title} className="dark:hidden" draggable={false} />
              <img src={eventImage(item, true)} alt={item.title} className="hidden dark:block" draggable={false} />
              <span>{item.category || (item.scope === 'city' ? 'Baguio City' : 'BCCC Event')}</span>
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        className="bccc-film-arrow is-left"
        onClick={() => setActive((value) => wrap(value - 1, items.length))}
        aria-label="Previous event"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        className="bccc-film-arrow is-right"
        onClick={() => setActive((value) => wrap(value + 1, items.length))}
        aria-label="Next event"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeEvent.id}
          className="bccc-film-details"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: 'blur(9px)' }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12, filter: 'blur(8px)' }}
          transition={{ duration: 0.46, ease: easeLuxury }}
        >
          <p>
            <Film className="h-3.5 w-3.5" />
            Featured Event
          </p>
          <h3>{activeEvent.title}</h3>
          <EventMeta item={activeEvent} />
          <span>{activeEvent.summary || activeEvent.description || 'Event details will be updated by the BCCC office.'}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function EventsHighlights({ items = [], pageMode = false }: Props) {
  const [tab, setTab] = useState<ScopeKey>('bccc');

  const { bcccEvents, cityEvents } = useMemo(() => {
    const visible = items.filter((item) => item.isPublic !== false);
    const bccc = visible.filter((item) => item.scope !== 'city');
    const city = visible.filter((item) => item.scope === 'city');

    return {
      bcccEvents: bccc.length > 0 ? bccc : visible,
      cityEvents: city,
    };
  }, [items]);

  const currentItems = tab === 'bccc' ? bcccEvents : cityEvents;

  return (
    <section className={cx('bccc-film-section', pageMode && 'is-page-mode')}>
      <div className="public-container">
        <div className="bccc-film-heading">
          <div>
            <p className="bccc-section-kicker light">
              <Sparkles className="h-3.5 w-3.5" />
              Event Highlights
            </p>
            <h2>Film-style public event carousel with focused center reveal.</h2>
          </div>

          <Link href="/events" className="bccc-film-view-all">
            View all events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ScopeToggle
          tab={tab}
          setTab={setTab}
          bcccCount={bcccEvents.length}
          cityCount={cityEvents.length}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 34, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -34, filter: 'blur(12px)' }}
            transition={{ duration: 0.62, ease: easeLuxury }}
          >
            <FilmCarousel items={currentItems} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
