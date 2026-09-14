export function SetupNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <p className="font-medium">Supabase is not configured yet.</p>
      <p className="mt-1">
        Copy <code>.env.example</code> to <code>.env.local</code>, fill in your
        Supabase URL and anon key, then run the migration in{" "}
        <code>supabase/migrations/0001_init.sql</code> against your project.
      </p>
    </div>
  );
}
