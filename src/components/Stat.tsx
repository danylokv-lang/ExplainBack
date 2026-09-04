const TONES = {
  accent: "bg-accent-bg text-accent",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  void: "bg-void-bg text-void",
} as const;

export function Stat({
  label,
  value,
  unit,
  note,
  icon: Icon,
  tone = "accent",
}: {
  label: string;
  value: string | number;
  unit?: string;
  note?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="panel card-hover p-5">
      <div className="flex items-center justify-between">
        <p className="label">{label}</p>
        {Icon && (
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="display mt-3 text-4xl tabular-nums text-ink">
        {value}
        {unit && <span className="text-2xl text-ink-3">{unit}</span>}
      </p>
      {note && <p className="mt-2 text-sm leading-normal text-ink-3">{note}</p>}
    </div>
  );
}
