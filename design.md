# Wearabouts landing and onboarding design

## Implemented scope

The public Wearabouts page uses the supplied Wearabouts reference as a visual source. It keeps the warm editorial direction while replacing placeholder actions and unsupported claims with the implemented wardrobe-first journey.

- Hero with the supplied wardrobe scene and one clear sign-up action.
- Four-stage desktop narrative: wardrobe, context, comparison and outfit. Small screens and reduced-motion preferences use stacked, readable cards.
- Feature, explainability, pricing and privacy sections tied to the Wearabouts MVP.
- Pricing shows the free beta and a planned Wearabouts Plus price of S$8.90 per month. The planned tier is clearly unavailable for purchase.
- Accessible skip link, semantic headings, keyboard-focusable links, descriptive meaningful-image alt text, decorative narrative images hidden from assistive technology, and mobile navigation.
- All public-page rules are scoped under `.drape-public` so they do not alter the authenticated application.

## Visual tokens

The page uses `#F6F3EC` paper, `#171916` dark panels, `#1A1C19` ink, `#E59B87` coral actions, `#E4E4DC` soft surfaces, and `#55704F` compatibility cues. Fraunces is used for editorial headings and Inter for interface copy. Content follows an 8 px spacing rhythm, 12 px button radii, 18–28 px card/image radii, and low-contrast broad shadows.

## Sources and asset handling

The visual direction, copy rhythm and motion treatment were adapted from `design(1).md` and `Wearabouts_Cinematic_Landing (3).html`, supplied as design references. The five unique non-empty embedded WebP images were extracted once to `app/public/landing/`; the duplicated mobile/desktop payloads are deduplicated. The supplied embedded fonts were extracted to the same directory: `font-1.woff` is Fraunces, `font-2.woff` is Inter Regular, and `font-3.woff` is Inter SemiBold.

The public page does not claim that the example recommendation is measured truth. The explainability card labels its signals as an illustration. Live SEO metadata, canonical URL, Open Graph values and analytics are owned by the app shell.

## Onboarding

Registration leads to four steps. Style asks for an optional display name and selectable preferences. Colours keeps liked and avoided choices mutually exclusive. Everyday context collects occasions, optional coverage or comfort notes, and optional user-entered sizes. The final step reuses the established upload, editable AI review and confirmation component. Every preference is optional. Back preserves the current draft; saving persists the profile before advancing to upload.

Desktop onboarding has an editorial side panel and a focused form. Below 900 px, the form becomes a single column. Controls have visible focus, selected states use both colour and check marks, and progress announces the current step. On each step change, focus moves to its heading. Pending saves disable the form. Failures preserve the user's answers. The local preview explicitly does not persist data.

The first saved item shows a completion screen linking to that item and the wardrobe. Returning users with confirmed items proceed to the wardrobe. A presentation-only auth metadata marker resumes the upload step after preferences are saved; ownership still comes from the authenticated user and database policies.

## Brand and launch details

The supplied Wearabouts mark combines a W and a hanger. The public wordmark follows the supplied `wear` and `abouts` weight contrast. The icon uses the same line mark. This is a reference adaptation, not a claim that the team created the source artwork.

The root metadata uses Wearabouts. Search crawlers receive a canonical landing URL, descriptions, sitemap and robots rules. Social previews have a generated 1200 by 630 card. Private screens are not indexed. Optional analytics follows consent and sends only curated funnel events.

Internal `.drape-*` selectors and the existing resume-marker name remain implementation identifiers for compatibility. They are not user-facing branding. The teammate-owned application keeps its existing layout and product logic.
