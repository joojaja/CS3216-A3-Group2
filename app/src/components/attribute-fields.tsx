"use client";

import {
  CLOTHING_CATEGORIES,
  FORMALITY_LEVELS,
  LAYERING_ROLES,
  WEATHER_TAGS,
  type EditableAttributes,
} from "@/lib/schemas/ai";

// The editable clothing attributes, shared by the add-item review step and
// the wardrobe item editor. Confidence tags are optional: the review step
// shows what the AI drafted, the editor shows none.

export type Tag = "ok" | "low" | null;

export const inputClass =
  "mt-1.5 block w-full rounded-lg border px-3 py-2.5 text-sm font-normal transition focus:border-cobalt focus:outline-none focus:ring-[3px] focus:ring-cobalt-light";

export function ConfidenceTag({ tag }: { tag: Tag }) {
  if (!tag) return null;
  return (
    <span
      className={`absolute top-0 right-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${
        tag === "low" ? "bg-warn-light text-warn" : "bg-cobalt-light text-cobalt-deep"
      }`}
    >
      {tag === "low" ? "Check this" : "AI drafted"}
    </span>
  );
}

function Field({ label, tag, children }: { label: string; tag: Tag; children: React.ReactNode }) {
  return (
    <label className="relative block text-[13.5px] font-medium">
      {label}
      <ConfidenceTag tag={tag} />
      {children}
    </label>
  );
}

export function AttributeFields({
  attrs,
  onChange,
  tagFor = () => null,
  disabled = false,
}: {
  attrs: EditableAttributes;
  onChange: <K extends keyof EditableAttributes>(key: K, value: EditableAttributes[K]) => void;
  tagFor?: (key: keyof EditableAttributes) => Tag;
  disabled?: boolean;
}) {
  function cls(name: keyof EditableAttributes) {
    return `${inputClass} ${
      tagFor(name) === "low" ? "border-warn-line bg-[#faf6ea]" : "border-line bg-white"
    } disabled:opacity-60`;
  }

  return (
    <>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Category" tag={tagFor("category")}>
          <select
            value={attrs.category}
            disabled={disabled}
            onChange={(e) => onChange("category", e.target.value as EditableAttributes["category"])}
            className={cls("category")}
          >
            {CLOTHING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Subcategory" tag={tagFor("subcategory")}>
          <input
            value={attrs.subcategory}
            disabled={disabled}
            onChange={(e) => onChange("subcategory", e.target.value)}
            placeholder="e.g. t-shirt, chinos, sundress"
            className={cls("subcategory")}
          />
        </Field>

        <Field label="Primary colour" tag={tagFor("primary_colour")}>
          <input
            value={attrs.primary_colour}
            disabled={disabled}
            onChange={(e) => onChange("primary_colour", e.target.value)}
            className={cls("primary_colour")}
          />
        </Field>

        <Field label="Secondary colours (comma separated)" tag={tagFor("secondary_colours")}>
          <input
            value={attrs.secondary_colours.join(", ")}
            disabled={disabled}
            onChange={(e) =>
              onChange(
                "secondary_colours",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
            className={cls("secondary_colours")}
          />
        </Field>

        <Field label="Pattern" tag={tagFor("pattern")}>
          <input
            value={attrs.pattern}
            disabled={disabled}
            onChange={(e) => onChange("pattern", e.target.value)}
            className={cls("pattern")}
          />
        </Field>

        <Field label="Material cues" tag={tagFor("material_cues")}>
          <input
            value={attrs.material_cues}
            disabled={disabled}
            onChange={(e) => onChange("material_cues", e.target.value)}
            className={cls("material_cues")}
          />
        </Field>

        <Field label="Formality" tag={tagFor("formality")}>
          <select
            value={attrs.formality}
            disabled={disabled}
            onChange={(e) => onChange("formality", e.target.value as EditableAttributes["formality"])}
            className={cls("formality")}
          >
            {FORMALITY_LEVELS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </Field>

        <Field label="Layering role" tag={tagFor("layering_role")}>
          <select
            value={attrs.layering_role}
            disabled={disabled}
            onChange={(e) =>
              onChange("layering_role", e.target.value as EditableAttributes["layering_role"])
            }
            className={cls("layering_role")}
          >
            {LAYERING_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="relative block w-full text-[13.5px] font-medium">
          Suitable weather
          <ConfidenceTag tag={tagFor("weather_tags")} />
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEATHER_TAGS.map((tag) => {
            const on = attrs.weather_tags.includes(tag);
            return (
              <label
                key={tag}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] transition ${
                  on ? "border-cobalt bg-cobalt-light text-cobalt-deep" : "border-line"
                } ${disabled ? "opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(
                      "weather_tags",
                      e.target.checked
                        ? [...attrs.weather_tags, tag]
                        : attrs.weather_tags.filter((t) => t !== tag),
                    )
                  }
                  className="accent-cobalt"
                />
                {tag}
              </label>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}
