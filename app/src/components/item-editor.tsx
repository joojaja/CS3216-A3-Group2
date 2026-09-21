"use client";

import { trackFunnel } from "@/lib/analytics";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { WardrobeItem } from "@/lib/types";
import type { EditableAttributes } from "@/lib/schemas/ai";
import { AttributeFields, inputClass } from "@/components/attribute-fields";
import { GarmentIcon, tintFor } from "@/components/garment-icon";
import { useToast } from "@/components/toast";

// Turns a stored row into the editable shape. Nullable columns become empty
// strings so the inputs are always controlled, and enum columns fall back to
// a valid default if a row predates the current vocabulary.
function toEditable(item: WardrobeItem): EditableAttributes {
  return {
    category: item.category as EditableAttributes["category"],
    subcategory: item.subcategory ?? "",
    primary_colour: item.primary_colour ?? "",
    secondary_colours: item.secondary_colours ?? [],
    pattern: item.pattern ?? "",
    material_cues: item.material_cues ?? "",
    formality: (item.formality ?? "casual") as EditableAttributes["formality"],
    layering_role: (item.layering_role ?? "standalone") as EditableAttributes["layering_role"],
    weather_tags: (item.weather_tags ?? []) as EditableAttributes["weather_tags"],
  };
}

export function ItemEditor({ item, live }: { item: WardrobeItem; live: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = useState(() => ({ attrs: toEditable(item), notes: item.user_notes ?? "" }));
  const [attrs, setAttrs] = useState<EditableAttributes>(saved.attrs);
  const [notes, setNotes] = useState(saved.notes);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    JSON.stringify(attrs) !== JSON.stringify(saved.attrs) || notes !== saved.notes;

  function setField<K extends keyof EditableAttributes>(key: K, value: EditableAttributes[K]) {
    setAttrs((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setBusy("save");
    setError(null);
    try {
      const res = await fetch(`/api/items?id=${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: attrs, user_notes: notes }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not save changes");
        return;
      }
      setSaved({ attrs, notes });
      trackFunnel("item_updated");
      toast("Changes saved");
      router.refresh();
    } catch {
      setError("Could not confirm the save. Your edits are still here. Please check your connection and retry.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Delete this item and its photo? This cannot be undone.")) return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/items?id=${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not delete the item. Try again.");
        return;
      }
      toast("Item removed");
      trackFunnel("item_deleted");
      router.push("/wardrobe");
      router.refresh();
    } catch {
      setError("Could not confirm deletion. Check your wardrobe before trying again.");
    } finally {
      setBusy(null);
    }
  }

  const tint = tintFor(item.primary_colour);
  const ai = item.ai_confidence;
  const flagged = ai?.uncertain_fields?.filter(Boolean) ?? [];

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr] md:gap-8">
      <div>
        <div className="overflow-hidden rounded-xl border border-line bg-wash">
          {item.signed_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.signed_image_url}
              alt={[item.primary_colour, item.subcategory ?? item.category].filter(Boolean).join(" ")}
              className="aspect-square w-full object-cover md:aspect-[4/5]"
            />
          ) : (
            <div
              className="grid aspect-square w-full place-items-center md:aspect-[4/5]"
              style={{ background: tint.bg, color: tint.fg }}
            >
              <GarmentIcon kind={item.category} className="w-[46%]" />
            </div>
          )}
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-mute">
          The photo cannot be changed here. Delete the item and add it again to
          use a different photo.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid content-start gap-4"
      >
        {ai?.notes && (
          <div className="rounded-xl bg-wash px-4 py-3.5 text-[14px] leading-relaxed text-body">
            <b className="block font-semibold text-ink">What the AI drafted when this was added</b>
            {ai.notes}
            {flagged.length > 0 && (
              <span className="mt-1.5 block text-mute">
                It was unsure about: {flagged.map((f) => f.replace("_", " ")).join(", ")}.
              </span>
            )}
          </div>
        )}

        {error && <p className="text-sm text-bad">{error}</p>}

        <AttributeFields attrs={attrs} onChange={setField} disabled={!live || busy !== null} />

        <label className="block text-[13.5px] font-medium">
          Your notes
          <textarea
            value={notes}
            disabled={!live || busy !== null}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything the photo does not show"
            className={`${inputClass} border-line bg-white disabled:opacity-60`}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-line pt-4">
          <button
            type="button"
            onClick={save}
            disabled={!live || !dirty || busy !== null}
            className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:bg-accent-deep disabled:opacity-40"
          >
            {busy === "save" ? "Saving..." : "Save changes"}
          </button>
          {dirty && busy === null && (
            <button
              type="button"
              onClick={() => {
                setAttrs(saved.attrs);
                setNotes(saved.notes);
              }}
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition hover:bg-wash"
            >
              Discard changes
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={!live || busy !== null}
            className="ml-auto text-sm text-bad opacity-80 transition hover:opacity-100 disabled:opacity-40"
          >
            {busy === "delete" ? "Deleting..." : "Delete item"}
          </button>
        </div>

        {!live && (
          <p className="text-xs text-mute">Editing is disabled for demo items.</p>
        )}
      </motion.div>
    </div>
  );
}
