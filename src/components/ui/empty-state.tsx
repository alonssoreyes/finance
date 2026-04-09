type Props = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: Props) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white/50 px-5 py-8 text-center">
      <p className="font-semibold text-surface-strong">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
    </div>
  );
}
