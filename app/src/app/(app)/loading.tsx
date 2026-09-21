export default function Loading() {
  return (
    <section className="p-5 md:p-9" role="status" aria-label="Loading your wardrobe">
      <p className="mb-6 text-sm text-mute">Getting things ready...</p>
      <div aria-hidden="true" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="shim aspect-[3/4] rounded-2xl" />)}
      </div>
    </section>
  );
}
