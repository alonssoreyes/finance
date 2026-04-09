type Props = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function SectionCard({ title, description, children }: Props) {
  return (
    <section className="glass-card rounded-[1.75rem] p-5">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">{title}</p>
        <h2 className="mt-2 text-xl font-semibold text-surface-strong">{description}</h2>
      </div>
      {children}
    </section>
  );
}
