import { GripVertical, MoveDown, MoveUp, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

type SortItem = {
    id: number | string;
    title: string;
    subtitle?: string;
};

type SortOrderBoardProps = {
    title: string;
    description: string;
    items: SortItem[];
    onReorder: (orderedIds: Array<number | string>) => Promise<void>;
};

function reorderList<T>(items: T[], fromIndex: number, toIndex: number) {
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
}

export default function SortOrderBoard({
    title,
    description,
    items,
    onReorder,
}: SortOrderBoardProps) {
    const [localItems, setLocalItems] = useState(items);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const persist = async (nextItems: SortItem[]) => {
        setSaving(true);

        try {
            await onReorder(nextItems.map((item) => item.id));
            setLocalItems(nextItems);
        } finally {
            setSaving(false);
        }
    };

    return (
        <article className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#16171b]">
            <div className="border-b border-black/5 bg-[linear-gradient(135deg,#f8f5ee,#eef5f1)] px-5 py-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-black tracking-[0.16em] text-[#174f40] uppercase dark:text-[#9dc0ff]">
                            Display Order
                        </p>
                        <h3 className="mt-2 text-xl font-black tracking-tight">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-[#595651] dark:text-[#c8c8ce]">
                            {description}
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        <Sparkles className="h-4 w-4" />
                        {localItems.length} item
                        {localItems.length === 1 ? '' : 's'}
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-5">
                {localItems.map((item, index) => (
                    <div
                        key={item.id}
                        draggable={!saving}
                        onDragStart={() => setDragIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async () => {
                            if (dragIndex === null || dragIndex === index) {
                                setDragIndex(null);
                                return;
                            }

                            const next = reorderList(
                                localItems,
                                dragIndex,
                                index,
                            );
                            setDragIndex(null);
                            await persist(next);
                        }}
                        className={`group flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 transition ${
                            dragIndex === index
                                ? 'border-emerald-400 bg-emerald-50/80 dark:border-blue-400/40 dark:bg-blue-500/10'
                                : 'border-black/10 bg-[#fbf8f2] hover:border-emerald-300 hover:bg-white dark:border-white/10 dark:bg-[#1d1e23] dark:hover:border-blue-400/30 dark:hover:bg-[#20222a]'
                        }`}
                    >
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#9dc0ff]">
                            <GripVertical className="h-4 w-4" />
                        </div>

                        <div className="inline-flex h-9 min-w-[36px] shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-xs font-black text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                            {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">
                                {item.title}
                            </p>
                            {item.subtitle ? (
                                <p className="mt-1 truncate text-xs text-[#64615b] dark:text-[#bfbfc7]">
                                    {item.subtitle}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={saving || index === 0}
                                onClick={async () => {
                                    const next = reorderList(
                                        localItems,
                                        index,
                                        index - 1,
                                    );
                                    await persist(next);
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                aria-label="Move item up"
                            >
                                <MoveUp className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                disabled={
                                    saving || index === localItems.length - 1
                                }
                                onClick={async () => {
                                    const next = reorderList(
                                        localItems,
                                        index,
                                        index + 1,
                                    );
                                    await persist(next);
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                aria-label="Move item down"
                            >
                                <MoveDown className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-black/5 bg-[#f7f2e8] px-5 py-3 text-sm text-[#5a5650] dark:border-white/10 dark:bg-[#1d1e23] dark:text-[#c8c8ce]">
                {saving
                    ? 'Saving new display order...'
                    : 'You can drag cards or use the arrow buttons to change order.'}
            </div>
        </article>
    );
}
