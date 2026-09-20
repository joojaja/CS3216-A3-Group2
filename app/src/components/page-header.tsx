export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-line px-5 pt-5 pb-4 md:flex-row md:items-end md:justify-between md:px-9 md:pt-8 md:pb-5">
      <div>
        {eyebrow && (
          <span className="mb-2 block text-[11px] font-semibold tracking-[0.15em] uppercase text-mute">
            {eyebrow}
          </span>
        )}
        <h1 className="font-serif text-[30px] leading-[1.06] tracking-[-0.04em] md:text-[38px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-mute md:text-[14.5px]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
