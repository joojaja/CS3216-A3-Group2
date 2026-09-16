export function SetupNotice() {
  return (
    <div className="rounded-[10px] border border-warn-line bg-warn-light px-4 py-3 text-[13.5px] leading-relaxed text-warn-ink">
      <b className="font-semibold">Supabase is not configured yet.</b> Copy{" "}
      <code>.env.example</code> to <code>.env.local</code>, fill in your Supabase
      URL and publishable key, then run <code>supabase/schema.sql</code> in the
      SQL editor of your project.
    </div>
  );
}
