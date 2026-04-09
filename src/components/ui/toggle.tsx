type Props = {
  label: string;
  name: string;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

export function Toggle({ label, name, checked = false, onChange }: Props) {
  return (
    <label className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-black/8 bg-white/70 px-4 py-3">
      <span className="text-sm font-medium text-surface-strong">{label}</span>
      <input
        className="h-4 w-4 accent-[#1098F7]"
        checked={checked}
        name={name}
        onChange={onChange}
        type="checkbox"
      />
    </label>
  );
}
