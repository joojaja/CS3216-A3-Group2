# Wearabouts design notes

Moved here from the repository root and checked against `main` at `716265d` on 23 September 2026. The public page and the design tokens described below have changed since this file was first written; the visual-token section now matches `app/src/app/globals.css` rather than the original reference file's exact values.

## Brand mark

The Wearabouts mark combines a W with a clothes hanger, making the wardrobe context visible without a generic robot or sparkle icon. The public wordmark uses the weight contrast between "wear" and "abouts" shown in the supplied reference. This is an adaptation of supplied reference artwork, not original work by the team; confirm the source, creator and usage rights before the final write-up claims it.

## Visual tokens

Design tokens live in `app/src/app/globals.css` under `@theme` and can drift from any value written here, so treat the file as the source of truth. As of this check, the palette uses a dark green ("cobalt," `#384b35`, with lighter and fainter variants), a coral accent ("tangerine," `#e59b87`), a warm paper background ("wash," `#eae9e1`), and a near-black ink (`#1a1c19`) for text. Fraunces (`public/landing/font-1.woff`) sets editorial headings and Inter (`font-2.woff` regular, `font-3.woff` semibold) sets interface text. These fonts are self-hosted so the build does not depend on a live Google Fonts fetch.

## Sources and asset handling

The visual direction, copy rhythm and motion treatment were adapted from the supplied `design(1).md` and `Wearabouts_Cinematic_Landing (3).html` reference files. The unique embedded images from that reference were extracted once to `app/public/landing/`, with duplicate mobile and desktop copies removed. Confirm image and font attribution with the reference author before public launch.

## Onboarding

Registration leads to a four-step flow implemented in `app/src/components/onboarding-flow.tsx`: "Your style," "Your colours," "Your day," and "Your first item." Every preference is optional, and the last step reuses the same upload, AI review and confirmation flow as the main wardrobe. Saving one confirmed item completes onboarding; returning accounts with confirmed items go straight to the wardrobe. Preferences remain editable from Profile afterward.

## Application-wide consistency

The wardrobe, item upload and editing, outfit planner, purchase evaluator, My Style, sizing and profile screens share the landing page's palette, a charcoal navigation rail, Fraunces headings, and rounded cards. Inputs and actions keep at least 44 px touch targets with visible keyboard focus. The app includes a skip link and honours reduced-motion preferences. Loading, missing-page and recoverable-error views use the same shared components, so a network failure in the purchase evaluator, for example, recovers without discarding the selected image.
