type Props = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: Props) {
  return (
    <div className="px-1">
      <p className="text-sm uppercase tracking-[0.22em] text-ink-muted">
        {title}
      </p>
      <h1 className="mt-2 font-display text-4xl text-surface-strong">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-muted">{description}</p>
    </div>
  );
}
