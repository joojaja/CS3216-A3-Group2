export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="app-page-header flex flex-col gap-3 border-b border-line px-5 pt-4 pb-3.5 md:flex-row md:items-end md:justify-between md:px-9 md:pt-6 md:pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-[26px]">{title}</h1>
        {description && (
          <p className="mt-1 max-w-[64ch] text-[13.5px] text-mute md:text-[14.5px]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
