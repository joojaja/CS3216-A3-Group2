// Fills a wardrobe with a minimalist, Singapore-appropriate set of sample
// items so the outfit planner and purchase evaluator can be tested without
// photographing anything. Attributes are written directly as confirmed, so
// no AI call is made and nothing is spent.
//
//   npm run seed:wardrobe            add the items (refuses if samples exist)
//   npm run seed:wardrobe -- --reset replace existing sample items
//   npm run seed:wardrobe -- --remove delete the sample items only
//
// Signs in with your own account, so the items are yours and covered by the
// usual row ownership policies. Real items are never touched: samples are
// identified by the marker in user_notes.

import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";

const MARKER = "Sample item added by scripts/seed-wardrobe.mjs";
const BUCKET = "wardrobe-images";

// A neutral palette in breathable fabrics: what a minimalist wardrobe looks
// like when it has to go from humid streets into cold air-conditioning and
// cover campus, the office, dinner and a hawker centre with the same pieces.
// One sleepwear item is included on purpose, so a good planner has something
// it must learn not to suggest for going out.
const ITEMS = [
  // Tops
  { name: "White crew-neck tee", category: "top", subcategory: "t-shirt", primary_colour: "white", pattern: "solid", material_cues: "cotton jersey", formality: "casual", layering_role: "base", weather_tags: ["hot_humid", "all_weather"] },
  { name: "Black crew-neck tee", category: "top", subcategory: "t-shirt", primary_colour: "black", pattern: "solid", material_cues: "cotton jersey", formality: "casual", layering_role: "base", weather_tags: ["hot_humid", "all_weather"] },
  { name: "Grey marl tee", category: "top", subcategory: "t-shirt", primary_colour: "grey", pattern: "marl", material_cues: "cotton jersey", formality: "casual", layering_role: "base", weather_tags: ["hot_humid"] },
  { name: "White short-sleeve linen shirt", category: "top", subcategory: "linen shirt", primary_colour: "white", pattern: "solid", material_cues: "linen", formality: "smart_casual", layering_role: "standalone", weather_tags: ["hot_humid"] },
  { name: "Light blue oxford shirt", category: "top", subcategory: "oxford shirt", primary_colour: "blue", pattern: "solid", material_cues: "cotton oxford", formality: "smart_casual", layering_role: "base", weather_tags: ["air_conditioned", "all_weather"] },
  { name: "Navy polo", category: "top", subcategory: "polo shirt", primary_colour: "navy", pattern: "solid", material_cues: "cotton pique", formality: "smart_casual", layering_role: "standalone", weather_tags: ["hot_humid", "all_weather"] },
  { name: "Olive Cuban-collar shirt", category: "top", subcategory: "cuban collar shirt", primary_colour: "olive", pattern: "solid", material_cues: "viscose linen blend", formality: "smart_casual", layering_role: "standalone", weather_tags: ["hot_humid"] },
  // Bottoms
  { name: "Beige chinos", category: "bottom", subcategory: "chinos", primary_colour: "beige", pattern: "solid", material_cues: "cotton twill", formality: "smart_casual", layering_role: "standalone", weather_tags: ["all_weather"] },
  { name: "Navy tailored trousers", category: "bottom", subcategory: "tailored trousers", primary_colour: "navy", pattern: "solid", material_cues: "lightweight wool blend", formality: "business", layering_role: "standalone", weather_tags: ["air_conditioned", "all_weather"] },
  { name: "Black tailored shorts", category: "bottom", subcategory: "tailored shorts", primary_colour: "black", pattern: "solid", material_cues: "cotton", formality: "casual", layering_role: "standalone", weather_tags: ["hot_humid"] },
  { name: "Light-wash straight jeans", category: "bottom", subcategory: "straight jeans", primary_colour: "blue", secondary_colours: ["denim"], pattern: "solid", material_cues: "denim", formality: "casual", layering_role: "standalone", weather_tags: ["air_conditioned", "cool_evening"] },
  { name: "Grey wide-leg linen trousers", category: "bottom", subcategory: "linen trousers", primary_colour: "grey", pattern: "solid", material_cues: "linen", formality: "smart_casual", layering_role: "standalone", weather_tags: ["hot_humid"] },
  // Outerwear, mostly for air-conditioning
  { name: "Navy unstructured blazer", category: "outerwear", subcategory: "unlined blazer", primary_colour: "navy", pattern: "solid", material_cues: "tropical wool blend", formality: "business", layering_role: "outer", weather_tags: ["air_conditioned", "cool_evening"], notes: "Half-lined. For meetings, dinners and cold offices." },
  { name: "Stone overshirt", category: "outerwear", subcategory: "overshirt", primary_colour: "beige", pattern: "solid", material_cues: "cotton twill", formality: "smart_casual", layering_role: "outer", weather_tags: ["air_conditioned", "cool_evening"], notes: "Light layer for cinemas, malls and lecture theatres." },
  { name: "Black packable rain shell", category: "outerwear", subcategory: "rain jacket", primary_colour: "black", pattern: "solid", material_cues: "nylon", formality: "casual", layering_role: "outer", weather_tags: ["rain"], notes: "Folds into its own pocket." },
  // Footwear
  { name: "White leather sneakers", category: "footwear", subcategory: "sneakers", primary_colour: "white", pattern: "solid", material_cues: "leather", formality: "smart_casual", layering_role: "standalone", weather_tags: ["all_weather"] },
  { name: "Brown suede loafers", category: "footwear", subcategory: "loafers", primary_colour: "brown", pattern: "solid", material_cues: "suede", formality: "smart_casual", layering_role: "standalone", weather_tags: ["air_conditioned"], notes: "Suede. Keep out of the rain." },
  { name: "Black leather sandals", category: "footwear", subcategory: "sandals", primary_colour: "black", pattern: "solid", material_cues: "leather", formality: "casual", layering_role: "standalone", weather_tags: ["hot_humid", "rain"] },
  // Accessories and bag
  { name: "Black cap", category: "accessory", subcategory: "cap", primary_colour: "black", pattern: "solid", material_cues: "cotton", formality: "casual", layering_role: "standalone", weather_tags: ["hot_humid"] },
  { name: "Tan leather belt", category: "accessory", subcategory: "belt", primary_colour: "tan", pattern: "solid", material_cues: "leather", formality: "smart_casual", layering_role: "standalone", weather_tags: ["all_weather"] },
  { name: "Natural canvas tote", category: "bag", subcategory: "tote bag", primary_colour: "cream", pattern: "solid", material_cues: "canvas", formality: "casual", layering_role: "standalone", weather_tags: ["all_weather"] },
  // Activewear and sleepwear
  { name: "Grey running tee", category: "activewear", subcategory: "running t-shirt", primary_colour: "grey", pattern: "solid", material_cues: "moisture-wicking polyester", formality: "casual", layering_role: "base", weather_tags: ["hot_humid"] },
  { name: "Navy cotton pyjama set", category: "sleepwear", subcategory: "pyjama set", primary_colour: "navy", pattern: "solid", material_cues: "cotton", formality: "casual", layering_role: "standalone", weather_tags: ["air_conditioned"] },
];

// Same silhouettes and tints the app uses for items without a photo, so the
// sample tiles look like the rest of the interface rather than stock photos
const ICONS = {
  top: '<path d="M23 10h18l13 7-6 10-4-2v27H20V25l-4 2-6-10z"/>',
  shirt: '<path d="M22 10 32 16l10-6 12 7-5 11-4-2v26H19V26l-4 2-5-11z"/>',
  bottom: '<path d="M18 8h28l3 48H36l-4-26-4 26H15z"/>',
  outerwear: '<path d="M24 10 32 15l8-5 13 8-5 10-3-2v28H19V26l-3 2-5-10z"/><path d="M32 15v39"/>',
  footwear: '<path d="M8 40h16l10-9 8 4 14 5v8H8z"/>',
  bag: '<path d="M14 24h36l-3 30H17z"/><path d="M24 24v-4a8 8 0 0116 0v4"/>',
  cap: '<path d="M14 38a18 18 0 0136 0z"/><path d="M8 38h50l-2 6H10z"/>',
  belt: '<rect x="8" y="26" width="48" height="12" rx="2"/><rect x="26" y="22" width="12" height="20" rx="2"/>',
};
const TINTS = {
  white: ["#EEF1FB", "#2549E8"], cream: ["#FFF6E5", "#A46B00"], black: ["#E8EAF3", "#12163A"],
  grey: ["#E8EAF3", "#3A4070"], navy: ["#DCE4FF", "#1733AE"], blue: ["#DCE4FF", "#1733AE"],
  olive: ["#EAF0DC", "#4E6B1F"], brown: ["#F1E4DA", "#7A4A25"], beige: ["#F5EDE2", "#8A6A45"],
  tan: ["#F5EDE2", "#8A6A45"],
};

function iconFor(item) {
  if (item.subcategory.includes("shirt") && item.category === "top" && !item.subcategory.includes("t-shirt")) return ICONS.shirt;
  if (item.subcategory === "cap") return ICONS.cap;
  if (item.subcategory === "belt") return ICONS.belt;
  return ICONS[item.category] ?? (item.category === "sleepwear" ? ICONS.shirt : ICONS.top);
}

function escapeXml(text) {
  return text.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]);
}

function tileSvg(item) {
  const [bg, fg] = TINTS[item.primary_colour] ?? ["#EEF1FB", "#2549E8"];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 600" width="480" height="600">
<rect width="480" height="600" fill="${bg}"/>
<g transform="translate(112 120) scale(4)" fill="none" stroke="${fg}" stroke-width="2.4" stroke-linejoin="round">${iconFor(item)}</g>
<text x="240" y="500" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="600" fill="${fg}">${escapeXml(item.name)}</text>
<text x="240" y="536" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" fill="${fg}" opacity="0.7">Sample item</text>
</svg>`;
}

function ask(question, { hidden = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    // Echo nothing while the password is typed
    rl._writeToOutput = (text) => { if (text.includes(question)) rl.output.write(question); };
  }
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(answer.trim()); }));
}

async function main() {
  const envPath = path.resolve(".env.local");
  if (!existsSync(envPath)) throw new Error("Run this from the app directory, where .env.local lives");
  process.loadEnvFile(envPath);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in .env.local");

  const reset = process.argv.includes("--reset");
  const removeOnly = process.argv.includes("--remove");

  const email = process.env.SEED_EMAIL || (await ask("Account email: "));
  const password = process.env.SEED_PASSWORD || (await ask("Password (not shown): ", { hidden: true }));

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError || !session.user) throw new Error(`Sign-in failed: ${signInError?.message ?? "no user"}`);
  const userId = session.user.id;
  console.log(`Signed in as ${email}`);

  const { data: existing, error: listError } = await supabase
    .from("wardrobe_items")
    .select("id, image_path")
    .eq("user_id", userId)
    .eq("user_notes", MARKER);
  if (listError) throw new Error(`Could not read the wardrobe: ${listError.message}`);

  if (existing.length && (reset || removeOnly)) {
    await supabase.storage.from(BUCKET).remove(existing.map((item) => item.image_path));
    const { error } = await supabase.from("wardrobe_items").delete().in("id", existing.map((item) => item.id));
    if (error) throw new Error(`Could not remove the sample items: ${error.message}`);
    console.log(`Removed ${existing.length} sample item(s)`);
  } else if (existing.length) {
    console.log(`${existing.length} sample item(s) already in this wardrobe. Use --reset to replace them or --remove to delete them.`);
    return;
  }
  if (removeOnly) return;

  let added = 0;
  for (const item of ITEMS) {
    const imagePath = `${userId}/${randomUUID()}.svg`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(imagePath, Buffer.from(tileSvg(item)), { contentType: "image/svg+xml" });
    if (uploadError) throw new Error(`Upload failed for ${item.name}: ${uploadError.message}`);

    const { name, notes, ...attributes } = item;
    const { error } = await supabase.from("wardrobe_items").insert({
      user_id: userId,
      image_path: imagePath,
      secondary_colours: [],
      ...attributes,
      user_notes: MARKER,
      ai_confidence: {
        notes: notes ? `${name}. ${notes}` : name,
        uncertain_fields: [],
        image_source: "original",
      },
      attributes_confirmed: true,
    });
    if (error) {
      await supabase.storage.from(BUCKET).remove([imagePath]);
      throw new Error(`Insert failed for ${item.name}: ${error.message}`);
    }
    added++;
    console.log(`  added ${item.name}`);
  }
  console.log(`Done: ${added} sample items in the wardrobe. Remove them later with --remove.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
