
type Props = {
  title: string;
  description?: string;
};

export default function OpsEmptyState({ title, description }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 px-6 py-10 text-center dark:border-white/10">
      <div className="text-base font-semibold text-slate-900 dark:text-white">{title}</div>
      {description ? (
        <div className="mt-2 text-sm text-slate-500 dark:text-slate-300">{description}</div>
      ) : null}
    </div>
  );
}
