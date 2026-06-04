import { GripVertical, MoveDown, MoveUp } from 'lucide-react';
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
        <article className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
            <div className="mb-4">
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

            <div className="space-y-3">
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
                        className="flex items-center gap-3 rounded-[1.4rem] border border-black/10 bg-[#fbf8f2] px-4 py-3 dark:border-white/10 dark:bg-[#1d1e23]"
                    >
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#9dc0ff]">
                            <GripVertical className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">
                                {item.title}
                            </p>
                            {item.subtitle && (
                                <p className="mt-1 truncate text-xs text-[#64615b] dark:text-[#bfbfc7]">
                                    {item.subtitle}
                                </p>
                            )}
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
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 disabled:opacity-40 dark:border-white/10"
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
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 disabled:opacity-40 dark:border-white/10"
                                aria-label="Move item down"
                            >
                                <MoveDown className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 rounded-[1.2rem] bg-[#f7f2e8] px-4 py-3 text-sm text-[#5a5650] dark:bg-[#1d1e23] dark:text-[#c8c8ce]">
                {saving
                    ? 'Saving new display order...'
                    : 'You can drag cards or use the arrow buttons to change order.'}
            </div>
        </article>
    );
}
