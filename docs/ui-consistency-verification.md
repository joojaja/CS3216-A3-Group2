# Application design and launch verification

Verified locally on 21 September 2026. The application pages now share the landing and onboarding palette, heading font, rounded controls and warm surfaces. Existing workflow and database ownership logic remain in place.

## Coverage

| Requirement | Implementation and evidence |
| --- | --- |
| Consistent application pages | Wardrobe, upload, item editing, planner, evaluator and profile use the shared theme. |
| Mobile layouts | Wardrobe, upload, planner, evaluator and profile passed overflow checks at 390 by 844 and 1440 by 1000. Screenshots are in `output/playwright/`. |
| Navigation and accessibility | Active-page announcements, selected filter state, skip link, visible keyboard focus, 44 px controls and reduced-motion support. Profile includes sign-out for mobile users. |
| Loading and recovery | Shared loading and error views, branded missing-page screen, retained edits after item-save failure and recoverable purchase-network failures. |
| AI-specific controls | Existing editable extraction fields, uncertainty notes, explanations and feedback remain. Occasion examples populate a draft before submission. |
| SEO | Rendered title, description, canonical URL, Open Graph image and WebSite structured data checked. Existing sitemap and private-route noindex metadata retained. |
| Analytics | Consent-based GA4 now covers coarse application page groups and completion events. Mocked Google script verified no tag before consent, page events after consent and no tag after withdrawal. |
| Error recovery test | Aborted purchase API request returned the recovery message and re-enabled the comparison button. Both Gemini keys were empty during UI verification. |

## Checks

ESLint, four unit tests and a production webpack build passed. The default Turbopack build failed because its CSS worker could not bind a local port in this environment. The fallback build completed TypeScript validation and generated all routes. Screenshot capture before hydration briefly caused caret-style hydration warnings from browser screenshot manipulation; subsequent hydrated captures avoided those warnings. The intentional aborted purchase request produced the expected browser network error.

## Remaining requirements

Set the production site URL and GA4 measurement ID, disable Enhanced Measurement and verify real events in GA4 Realtime. Capture actual usage reports and social previews on the deployed URL. Local checks do not prove production delivery or provide milestone analytics insights.

Full account deletion and deletion of saved purchase records are still missing backend workflows. The privacy copy states the account-deletion limitation. They require authenticated server operations and storage cleanup, not a decorative UI control. No database migration or live service configuration was changed in this design update. Saved outfit history and favourites remain outside this update.
