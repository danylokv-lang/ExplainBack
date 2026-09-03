export function Stat({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string | number;
  unit?: string;
  note?: string;
}) {
  return (
    <div className="panel p-5">
      <p className="label">{label}</p>
      <p className="mt-3 font-display text-4xl leading-none tabular-nums text-ink">
        {value}
        {unit && <span className="text-xl text-ink-3">{unit}</span>}
      </p>
      {note && <p className="mt-2 text-xs leading-relaxed text-ink-3">{note}</p>}
    </div>
  );
}
