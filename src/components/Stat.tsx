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
      <p className="display mt-2 text-4xl tabular-nums text-ink">
        {value}
        {unit && <span className="text-2xl text-ink-3">{unit}</span>}
      </p>
      {note && <p className="mt-2 text-sm leading-normal text-ink-3">{note}</p>}
    </div>
  );
}
