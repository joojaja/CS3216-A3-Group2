# AGENTS.md

## Rules for agents

These rules apply to every agent working in this repository before any other work begins

1) **Read UNSLOP.md first** Every agent must read and process `UNSLOP.md` in the repository root and apply it to all user-facing text, documentation, write-ups and marketing copy it produces. `.claude/skills/` packages this and the other repository-specific rules (the paid-Gemini boundary, Supabase migration conventions, the checks to run before a PR, and how to write a milestone answer from evidence) as loadable skills; use them where they apply
2) **Never edit this file autonomously** Agents must not directly edit `AGENTS.md` under any circumstances. Any proposed change to this file requires explicit human approval. When proposing a change, present the exact edit clearly marked as a proposal (show the location, the current text and the replacement text) and wait for the human to approve before applying it
3) **Check the team before starting a feature** Before implementing any feature, inspect the GitHub repository branches and open pull requests (for example `git fetch` then `git branch -a`, and review open PRs) to check whether a teammate is already working on that feature. If someone is, highlight this clearly to the user, name the branch or PR, and coordinate instead of duplicating work
4) **The product is called Wearabouts** Refer to it as `Wearabouts` everywhere in code, copy and documentation. The supplied design document defines the visual identity. The name was reconfirmed on 20 September 2026.
5) **Respect the deadline** The web application must be fully completed by 23 September 2026. Plan and scope work around that date, not the original two-week estimate
6) **Never spend on the paid Gemini tier** Agents must not make any call that is billed to the paid Google project, for any reason, including verification. That means never calling the Gemini API directly with `GOOGLE_GENERATIVE_AI_API_KEY`, never running probes, scripts or browser tests that reach `/api/items/analyze`, `/api/items/locate`, `/api/items/enhance`, `/api/purchases/evaluate` or `/api/sizing/extract` with a real key, and never routing new work to the paid key. Test those routes with mocked responses (`SIZING_EXTRACT_MOCK` covers sizing) or in the unconfigured demo mode. Only a human using the app may trigger a paid call. The outfit planner, the Explore feed and the style and daily-outfit features run on unbilled free-tier keys (`GOOGLE_GENERATIVE_AI_FREE_API_KEY` and `GOOGLE_GENERATIVE_AI_RAG_API_KEY`); agents may exercise these during verification, sparingly, within their free-tier limits

## Project overview

This project is a university web application called **Wearabouts**

Wearabouts is a wardrobe-first clothing assistant for users in Singapore. It helps users make better use of clothes they already own before recommending new purchases

The primary user journey is:

1) Add clothing items to a private digital wardrobe
2) Request an outfit for an occasion
3) Receive recommendations based on wardrobe contents, personal preferences and the Singapore weather forecast
4) Evaluate whether a potential purchase is useful or redundant
5) Provide feedback that improves future recommendations

The product must not become a generic AI stylist, open-ended chatbot or shopping affiliate site

## Deadline and scope

The web application must be fully completed by **23 September 2026**. The official CS3216 Assignment 3 submission deadline is **26 September 2026 at 7:59 am**, so the 23rd is the internal completion date and leaves a short buffer for submission material

This means the original two-week scope is now roughly **8 days** of build time. Treat scope decisions as urgent. Defer anything that does not directly support the demo journey or a graded milestone

## CS3216 Assignment 3 milestones

This project is graded against the milestones published at `https://cs3216.github.io/coursework/artificial-intelligence`. The milestones are 70% of the assignment grade and the remaining 30% is a coolness factor. There are 20 compulsory milestones plus one compulsory ungraded problem statement. Throughout this document, features are annotated with the milestone they address. Keep these mappings accurate as the product evolves, because the milestone write-up (`group-<number>-milestones.pdf`) must answer every one of them

### Phase 1: product strategy

- **Problem statement (compulsory, ungraded):** describe the problem the application solves → covered by the Core problem section
- **Competitive landscape:** list the 3 closest competitors with pros and cons and explain how the product is better → covered by the Competitive landscape section
- **Application description:** describe the application, its objectives and major user stories, with user authentication used meaningfully → covered by Project overview, MVP success criteria and the authentication feature
- **Moat:** explain the secret sauce and why the product is defensible against cloning → covered by the Moat section

### Phase 2: go-to-market

- **Target users and acquisition:** describe target users and the acquisition plan → covered by the Target user section
- **MVP scoping:** list MVP features, justify them, and name future expansions → covered by MVP priorities, Explicit non-goals and the Scope rule
- **Monetization and pricing:** define a pricing strategy, tiers and reasoning, including AI inference costs → must be documented in the write-up and reflected in the landing page pricing section

### Phase 3: AI integration

- **LLM usage:** explain how and why LLMs are used → covered by the AI workflows section
- **Prompt examples:** give two to three real prompts and explain their design → keep prompts versioned in the repository and document the design choices
- **Model and provider choice:** compare the chosen model against at least two alternatives and explain model parameters → document the comparison when the provider is selected
- **AI interaction patterns:** describe the patterns used (RAG, tool calling, structured outputs, agent loops, multi-step workflows) and why → covered by AI workflows and Structured AI outputs
- **Evaluation:** describe the evaluation dataset and strategy, and show results → covered by the Evaluation plan section
- **Production optimization:** describe optimization techniques with concrete latency, cost or UX metrics → apply techniques such as caching weather responses, batching calls, and using smaller models for simple tasks, then record the measured impact
- **Safety and security:** identify risks and describe at least two concrete safeguards → covered by the Security and privacy requirements section

### Phase 4: design

- **Name and logo:** the product name is Wearabouts. The supplied reference mark combines a W and a clothes hanger. Document the naming rationale and credit the reference artwork in the milestone write-up
- **Technology stack:** justify UI, database, web server, hosting and authentication choices against alternatives → document decisions as they are made
- **User experience:** describe three common workflows and why they were chosen → covered by the user journey, Demo scenario and Recommended application pages
- **AI-specific UI:** show UI decisions made because the app uses AI, beyond trivial disclaimers → covered by editable AI attributes, uncertainty display, suggest-accept flows and feedback controls in the User experience requirements

### Phase 5: launch

- **Landing page:** hero, features and pricing sections, SEO optimization and Open Graph social previews → covered by the Landing page requirements
- **Analytics:** embed an analytics tool early and report insights from the data → analytics must ship early because reports need time to accumulate meaningful data
- **Launch campaign:** prepare Product Hunt-style content and marketing materials → prepare after the MVP is stable

### Phase 6: optional, above and beyond

- Advanced RAG (Graph RAG, hybrid search, agentic RAG)
- Multi-agent systems or agent orchestration
- Model Context Protocol (MCP) server or client

These optional milestones contribute to the 30% coolness factor. Attempt them only after the complete P0 journey is polished and only where they add genuine product value

### Submission deliverables

Keep these in mind throughout the build:

- `group-<number>-milestones.pdf` write-up answering all compulsory milestones, including the live application URL and public repository link
- `group-<number>-pitch.pdf`, a one or two page pitch for the coolness factor
- `README.md` in the repository root listing group members and matriculation numbers, contributions, the application name, the live URL, local setup instructions and significant resources used
- All code in the repository, using a monorepo rather than submodules where possible

## Product principles

All product and engineering decisions should follow these principles:

1) **Wardrobe first.** Recommend outfits from the user's existing wardrobe before suggesting purchases
2) **User-confirmed understanding.** AI-generated clothing attributes must be editable
3) **Explain recommendations.** Show why an outfit or purchase assessment was produced
4) **Singapore relevance.** Consider tropical weather, local lifestyles and locally available clothing
5) **Deliberate consumption.** Help users avoid redundant and impulse purchases
6) **Privacy by default.** Wardrobe photos and preference data are private user information
7) **Honest uncertainty.** Do not claim the AI can reliably infer properties such as exact fabric, fit, weight, texture or comfort from an image
8) **Complete workflows over feature count.** Prioritize a polished end-to-end experience over many incomplete features

## Target user

The initial target user is a young adult or university student in Singapore who:

- Owns enough clothing that they forget what they already have
- Has difficulty deciding what to wear
- Shops online and occasionally makes redundant purchases
- Wants outfit suggestions suited to an occasion and Singapore's weather
- Is willing to photograph a small part of their wardrobe
- Values convenience but wants control over AI-generated information

This section supports the target users and acquisition milestone. The acquisition plan (campus communities, social channels, referral mechanics) must be written up separately for the milestones document

## Core problem

Users often buy clothing without considering:

- Whether they already own something similar
- Whether the item matches their existing wardrobe
- Whether it suits Singapore's climate
- Whether it fills a genuine wardrobe gap
- Whether they will realistically wear it

Wearabouts reduces this decision-making burden by building a persistent understanding of the user's wardrobe and preferences

This section is the answer to the compulsory ungraded problem-statement milestone

## Moat

Cloning a generic AI stylist takes a weekend. What is harder to clone:

- A wardrobe graph that grows more useful the longer a user stays, since switching means re-uploading and re-confirming every item
- Accumulated per-user feedback that personalizes recommendations in ways a fresh competitor cannot reproduce
- Pre-purchase redundancy evaluation tied to the user's actual wardrobe rather than generic styling advice
- Singapore-specific grounding: local weather, local occasions and local retail context that global competitors treat as an afterthought

This section supports the moat milestone. Expand it in the write-up with the team's chosen moat strategy

## Competitive landscape

This section supports the competitive landscape milestone, which requires the 3 closest competitors with pros and cons and an argument for why this product is better. Verify current offerings before finalizing the write-up, since these products change quickly

### Whering

A social digital wardrobe focused on wearing more of what users own. It reports more than 10 million users

- **Pros:** free with no wardrobe size limit; tracks cost per wear and wardrobe usage; lets friends browse and style each other's wardrobes; backed by eBay Ventures and Google's AI Futures Fund
- **Cons:** outfits are shuffles of owned items rather than suggestions matched to the user's taste; no way to request an outfit for a specific occasion; inspiration depends on which friends a user follows; no size guidance
- **What to learn and improve:** keep the wardrobe-first message and usage tracking. Add occasion-based planning grounded in Singapore weather, with visible reasoning

### Acloset

A digital wardrobe and AI stylist with automatic tagging, weather-aware daily outfits and personal colour analysis

- **Pros:** fast setup, since one mirror selfie can register several items; daily outfits use the weather and the user's calendar; analyses which colours and silhouettes suit the user; polished onboarding
- **Cons:** charges once a wardrobe passes 100 items, so the price rises as the app becomes more useful; suggestions need a well-tagged wardrobe before they work; the inspiration feed ranks popular users rather than the user's own style; no brand size guidance
- **What to learn and improve:** copy the low-friction upload and calm neutral palette. Differentiate with editable AI tags, explained recommendations and purchase checks against the owned wardrobe

### Alta

The most AI-led of the three: an AI stylist that plans outfits from the user's wardrobe, activities, occasion, budget and weather, with avatar try-on and shopping suggestions

- **Pros:** broadest AI feature set; free with no ads and no wardrobe size limit; try-on uses an avatar that resembles the user
- **Cons:** shopping suggestions earn Alta a commission, which conflicts with deliberate consumption; the inspiration feed is ranked socially; no size guidance when buying
- **What to learn and improve:** match its occasion planning, but keep revenue from subscriptions so no suggestion is ranked by what pays us

### How Wearabouts competes

Wearabouts should learn from competitor UI/UX, colour schemes and features, then go further:

- Wardrobe-first recommendations with visible reasoning, not unexplained verdicts
- User-confirmed AI attributes, so errors are correctable instead of silently trusted
- Pre-purchase redundancy evaluation and brand size guidance against the user's real wardrobe and measurements, which none of the three competitors offer
- Singapore grounding through real forecast data and local context
- Privacy-first storage as a stated product value, not a settings footnote

## MVP success criteria

The MVP is successful when a signed-in user can complete this journey:

1) Upload several clothing photographs
2) Review and correct AI-generated clothing attributes
3) Save the items to a private cloud wardrobe
4) Describe an occasion in natural language
5) Receive two or three outfits using real items from their wardrobe
6) Understand why each outfit was recommended
7) Upload a prospective purchase
8) See similar items already owned and whether the purchase fills a wardrobe gap
9) Provide feedback that influences a later recommendation

Every implementation decision should support this demo journey

## MVP priorities

### P0: required

These features must be completed before working on optional features

#### Authentication and user ownership

Milestone link: application description (authentication used meaningfully) and safety and security

- Account registration
- Sign-in and sign-out
- Protected application routes
- Every wardrobe item must belong to a specific user
- Users must never be able to access another user's wardrobe or photographs
- Authentication is meaningful here because wardrobes, preferences and feedback are per-user private data that drive personalization, which is the argument the milestone asks for

#### Personal style profile

Store a small set of useful preferences:

- Preferred styles
- Preferred and disliked colours
- Typical clothing sizes
- Common occasions
- Optional modesty or coverage preferences
- Optional notes supplied by the user

Keep onboarding short. Preferences can be updated later

#### Private digital wardrobe

Users must be able to:

- Upload a clothing photograph
- Review AI-generated attributes
- Correct incorrect or uncertain attributes
- Save the confirmed item
- View their wardrobe
- Edit an item
- Delete an item and its photograph

#### Multimodal clothing extraction

Milestone link: LLM usage, AI interaction patterns (multimodal input and structured outputs), prompt examples and AI-specific UI (suggest-accept editing)

The AI should return structured fields such as:

- Category
- Subcategory
- Primary colour
- Secondary colours
- Pattern
- Apparent material cues
- Formality
- Layering role
- Suitable weather
- Confidence or uncertainty notes

All AI responses must be schema-validated before being stored

#### Outfit recommendation

Milestone link: AI interaction patterns (multi-step workflow combining wardrobe retrieval, weather grounding and constrained generation) and production optimization

Users can describe an occasion, for example:

> Casual outdoor birthday lunch tomorrow afternoon

The application should consider:

- Occasion
- Formality
- Indoor or outdoor context
- Time of day
- The Singapore weather forecast (see Singapore weather section)
- User preferences
- Previous feedback
- Available wardrobe items

Return two or three complete outfit options with explanations

The AI may only recommend wardrobe item IDs supplied by the application. It must not invent clothing items

#### Purchase evaluation

Milestone link: moat and competitive landscape, since this feature is the clearest differentiation from all three competitors

Users can upload an image or screenshot of an item they are considering buying

The application should:

- Extract its clothing attributes
- Find similar items in the user's wardrobe
- Estimate redundancy
- Show existing items that would complement it
- Explain whether it appears to fill a wardrobe gap
- Communicate uncertainty when evidence is insufficient

Use decision labels such as:

- Likely redundant
- Potentially useful
- Fills a wardrobe gap
- Insufficient information

The final purchasing decision must remain with the user

#### Feedback loop

Milestone link: moat (accumulated personalization) and LLM usage justification

Users should be able to record:

- Wore this outfit
- Liked it
- Rejected it
- Too warm
- Too formal
- Too casual
- Uncomfortable
- Disliked the colour combination
- Other short reason

Later recommendations should use this feedback, even if the initial implementation uses simple preference weights rather than model training

#### Landing page and analytics

Milestone link: landing page, analytics and monetization milestones

- A public marketing landing page with hero, features and pricing sections
- SEO fundamentals: semantic headings, page titles and meta descriptions
- Open Graph tags for attractive sharing previews
- An embedded analytics tool (for example Google Analytics 4 or Microsoft Clarity) deployed early, because reports need time to accumulate meaningful data before submission

### P1: complete if time allows

- Save favourite outfits
- Regenerate an outfit while keeping one selected item
- Exclude an item from the next recommendation
- Small curated catalogue of Singapore retailers or thrift stores
- Basic wardrobe insights, such as rarely used items or category imbalance
- Outfit history
- Improved duplicate similarity scoring

### P2: stretch only

- Batch wardrobe uploads
- Calendar integration
- Wardrobe sharing
- Packing-list generation
- Price tracking
- Advanced wardrobe analytics
- Automatic background removal
- Optional Phase 6 milestones (advanced RAG, multi-agent orchestration, MCP) where they add real product value

P2 work must not begin until the complete P0 journey is polished and tested

## Singapore weather

The application is heavily based in the Singapore context. Weather inputs for outfit recommendations must come from real Singapore weather forecast data, not generic climate assumptions and not user guesses

- Use Singapore's official forecast sources, namely the National Environment Agency forecasts published through the data.gov.sg open APIs (2-hour, 24-hour and 4-day forecasts)
- Cache forecast responses per request window rather than calling the API per recommendation, which also serves the production optimization milestone
- Map forecast conditions (rain areas, temperature, humidity, time of day) to deterministic clothing rules such as breathable fabrics, rain cover and layer penalties
- When forecast data is unavailable, say so and fall back to a conservative tropical-weather default rather than fabricating conditions

## Explicit non-goals

Do not implement these for the MVP:

- Live Shopee, Amazon or marketplace scraping
- Marketplace checkout
- Real-time retailer inventory synchronization
- Virtual try-on
- Social feeds
- Public wardrobe profiles
- Training a custom computer-vision model
- Exact fabric recognition
- Automatic comfort or fit prediction
- Fully autonomous purchasing
- A general-purpose fashion chatbot
- A large-scale recommendation engine
- Complicated agent frameworks without a clear product need

Use a small controlled product catalogue and outbound retailer links if shopping recommendations are included

This list doubles as the future-expansions answer for the scoping milestone

## Recommended application pages

### Landing page

Milestone link: landing page milestone

Explain:

- The problem
- The wardrobe-first approach
- The main benefits
- How user data is handled

The page must include hero, features and pricing sections, semantic HTML for SEO, and Open Graph tags for social sharing previews

### Authentication

- Register
- Sign in
- Password recovery if supported by the chosen authentication service

### Onboarding

Collect only the minimum preferences required for useful recommendations

### Wardrobe

- Clothing grid
- Category filters
- Add-item button
- Item detail and editing
- Empty state that guides first-time users

### Add item

- Image upload
- Analysis progress
- Attribute confirmation form
- Clear indication that AI-generated details can be wrong

### Outfit planner

- Natural-language occasion input
- Date or weather context
- Optional constraints
- Outfit results
- Explanations and feedback controls

### Purchase evaluator

- Product image or screenshot upload
- Extracted attributes
- Similar wardrobe items
- Compatibility and redundancy assessment
- Optional local alternatives

### Profile and privacy settings

- Edit preferences
- Review data use
- Delete uploaded items
- Delete account and associated data

## Recommended data model

Adapt names to the selected database and framework

### UserProfile

- `user_id`
- `display_name`
- `preferred_styles`
- `preferred_colours`
- `disliked_colours`
- `sizes`
- `common_occasions`
- `preference_notes`
- `created_at`
- `updated_at`

### WardrobeItem

- `id`
- `user_id`
- `image_path`
- `category`
- `subcategory`
- `primary_colour`
- `secondary_colours`
- `pattern`
- `material_cues`
- `formality`
- `layering_role`
- `weather_tags`
- `user_notes`
- `ai_confidence`
- `attributes_confirmed`
- `created_at`
- `updated_at`

### OutfitRequest

- `id`
- `user_id`
- `occasion_text`
- `occasion_type`
- `formality`
- `indoor_outdoor`
- `requested_date`
- `weather_snapshot`
- `created_at`

### OutfitRecommendation

- `id`
- `request_id`
- `user_id`
- `wardrobe_item_ids`
- `explanation`
- `warnings`
- `created_at`

### RecommendationFeedback

- `id`
- `user_id`
- `recommendation_id`
- `action`
- `reason`
- `free_text`
- `created_at`

### PurchaseEvaluation

- `id`
- `user_id`
- `image_path`
- `extracted_attributes`
- `similar_wardrobe_item_ids`
- `compatibility_score`
- `redundancy_score`
- `decision_label`
- `explanation`
- `created_at`

### CatalogueItem

- `id`
- `retailer`
- `product_name`
- `product_url`
- `image_url`
- `price`
- `category`
- `colour`
- `style_tags`
- `weather_tags`
- `last_verified_at`

## AI workflows

Milestone link: this whole section supports the LLM usage, AI interaction patterns and prompt engineering milestones. Keep real prompt examples versioned in the repository so two or three can be quoted in the write-up

### Clothing extraction workflow

1) Validate the uploaded file
2) Store it in private storage
3) Send the image to a multimodal model
4) Request a strictly structured response
5) Validate the response against the application schema
6) Normalize categories and colours to supported values
7) Display the result to the user
8) Store only the user-confirmed version as authoritative

AI-generated values must not silently overwrite user corrections

### Outfit recommendation workflow

1) Interpret the user's occasion request into structured constraints
2) Retrieve the user's confirmed wardrobe items
3) Apply deterministic filters:
   - Weather suitability
   - Required outfit roles
   - Formality range
   - Explicitly excluded items
4) Include relevant preferences and feedback
5) Ask the model to rank or assemble outfits using only allowed item IDs
6) Validate all returned IDs
7) Reject malformed or invented results
8) Display recommendations with concise explanations

The model should not receive another user's data or the user's entire application history when only a small relevant subset is required

### Purchase evaluation workflow

1) Extract attributes from the prospective purchase
2) Compute similarity against existing wardrobe items
3) Estimate how many owned items could pair with it
4) Check whether the user already owns the same functional category
5) Apply weather and preference rules
6) Ask the model to explain the structured evidence
7) Display uncertainty and supporting wardrobe items

The redundancy decision should not come solely from an unconstrained prompt. It should combine deterministic comparison with an AI-generated explanation

### Preference-learning workflow

For the MVP, use transparent preference updates such as:

- Increase the weight of accepted styles or colours
- Decrease the weight of repeatedly rejected combinations
- Penalize warm layers after "too warm" feedback
- Remember explicit comfort and formality feedback
- Preserve user corrections as stronger evidence than initial AI guesses

Do not claim that the system has trained a personalized machine-learning model unless one was actually trained

## Deterministic rules

Use ordinary application rules where they are more reliable than an LLM

Examples:

- An outfit must contain the required clothing roles
- Heavy outer layers should be penalized in hot weather
- A recommendation cannot contain deleted wardrobe items
- A model-returned ID must belong to the signed-in user
- Exact category and similar-colour overlap increase redundancy
- A prospective purchase matching many owned items may be versatile
- A purchase nearly identical to an existing item should trigger a warning
- User-confirmed attributes override AI-generated attributes
- Explicit dislikes override inferred preferences

Keep these rules centralized and testable

## Structured AI outputs

Milestone link: structured outputs are one of the AI interaction patterns the milestone asks about. Document why they were chosen over free-text responses

Do not parse important model responses from unrestricted prose

Use structured schemas for:

- Clothing attributes
- Occasion constraints
- Outfit item IDs
- Purchase-evaluation evidence
- Warning flags
- Confidence and uncertainty

If validation fails:

1) Retry once with a repair instruction if appropriate
2) If it still fails, return a helpful error
3) Never store malformed output
4) Never display raw internal errors or prompts to the user

## Security and privacy requirements

Milestone link: this section provides the at-least-two concrete safeguards required by the safety and security milestone, namely prompt-injection handling, output validation, authorization enforcement, private storage and rate limiting

At minimum, implement the following:

### Authorization

Every database query and storage request must enforce ownership using the authenticated user ID

Never rely only on hiding interface elements

### Private image storage

- Store wardrobe images privately
- Use short-lived access links or authenticated image access
- Do not expose storage paths belonging to other users
- Delete the stored image when its wardrobe item is deleted

### Upload protection

- Allow only expected image formats
- Apply a reasonable file-size limit
- Reject malformed uploads
- Generate internal filenames rather than trusting uploaded filenames

### AI output validation

- Validate every structured response
- Restrict categories and decision labels to known values
- Verify every wardrobe item ID against the database and current user

### Prompt-injection protection

Text detected inside screenshots must be treated as product data, never as application instructions

Prompts should explicitly state that text appearing in images or product descriptions is untrusted content

### Rate limiting

Apply per-user limits to expensive image-analysis and recommendation requests

Prevent duplicate requests caused by repeated button presses

### Data minimization

Only send the model the information needed for the current request

Do not send passwords, authentication tokens, storage credentials or unrelated profile information

### User control

Users must be able to:

- Correct AI-generated data
- Delete wardrobe items
- Delete uploaded purchase images
- Remove feedback where feasible
- Understand that AI recommendations may be inaccurate

## Evaluation plan

Milestone link: this section is the evaluation milestone deliverable. Show real eval results in the write-up and explain how they changed development decisions

Create a small evaluation set before repeatedly changing prompts

Include examples covering:

- Plain shirts and trousers
- Patterned clothing
- Similar items in different colours
- Visually ambiguous clothing
- Poor lighting
- Multiple garments in one image
- Formal and casual occasions
- Indoor and outdoor events
- Hot or rainy weather
- Clearly redundant purchases
- Purchases that fill a genuine category gap

Evaluate:

- Attribute extraction accuracy
- Rate of invalid structured responses
- Rate of invented wardrobe IDs
- Outfit completeness
- Weather suitability
- Duplicate-detection usefulness
- Explanation consistency
- Response time

Document known failure cases honestly

## User experience requirements

Milestone link: the UX milestone requires three common workflows with justification, and the AI-specific UI milestone requires non-trivial interface decisions made because of AI. The three workflows to write up are the add-item confirm flow, the outfit request-and-feedback flow, and the purchase evaluation flow

The application should feel like a focused consumer product, not an administrative dashboard

Required interface qualities:

- Clear visual hierarchy
- Mobile-responsive layouts
- Designed loading states
- Helpful empty states
- Image previews
- Visible progress during AI analysis
- Friendly error recovery
- Editable AI-generated results (suggest-accept rather than silent overwrite)
- Concise explanations
- Accessible colour contrast and controls
- No default or obviously unstyled components in the final demo

Avoid making chat the primary interface. Structured controls should handle uploads, preferences, feedback and corrections. Natural language is most useful for describing occasions and constraints

Study competitor interfaces listed in the Competitive landscape section for colour scheme, layout and interaction ideas, then improve on them rather than copying them

## Recommended development sequence

### Phase 1: foundation

- Inspect the existing repository and framework before making changes
- Confirm the database and authentication approach
- Define shared data types and AI response schemas
- Create the primary page layouts
- Establish a consistent component and styling system
- Embed the analytics tool now so data accumulates before submission

### Phase 2: first vertical slice

Complete this flow before expanding the application:

1) Sign in
2) Upload one clothing image
3) Extract structured attributes
4) Correct the attributes
5) Save the item
6) View it in the wardrobe
7) Delete it safely

### Phase 3: outfit recommendations

- Add occasion interpretation
- Retrieve confirmed wardrobe items
- Wire in the Singapore weather forecast source
- Add deterministic filtering
- Generate validated outfit combinations
- Display explanations and feedback controls

### Phase 4: purchase evaluation

- Add prospective-purchase upload
- Implement wardrobe similarity comparison
- Compute redundancy and compatibility evidence
- Generate the final explanation

### Phase 5: personalization, catalogue and landing page

- Incorporate feedback into recommendation ranking
- Build the public landing page with hero, features and pricing sections plus SEO and Open Graph tags
- Add a small curated Singapore catalogue only if the core journey is stable

### Phase 6: hardening

- Test authorization boundaries
- Test invalid files and model failures
- Add rate limits
- Improve accessibility and responsive design
- Prepare seeded demo data
- Rehearse the complete user journey
- Draft the milestone write-up and pitch PDF

## Scope rule

The original two-week scope is now roughly 8 days, with the application fully complete by 23 September 2026

When considering a new feature, ask:

1) Does it strengthen the main demo journey
2) Does it address a compulsory milestone
3) Does it demonstrate meaningful AI use
4) Does it improve the visible MVP moat
5) Can it be completed and tested before the deadline
6) Does it introduce external API or data risk

If the answer to the first four questions is no, defer it

If it introduces significant scraping, partnership, inventory or marketplace dependencies, defer it

## Team coordination

Before starting any feature, check the GitHub repository for existing work:

- Run `git fetch` and inspect `git branch -a` for remote branches related to the feature
- Review open pull requests for overlapping work
- If a teammate's branch or PR already covers the feature, tell the user clearly that another person is working on it, name the branch or PR, and propose coordinating or picking different work instead of proceeding

A possible division is:

- **Frontend and design:** page layouts, wardrobe interface and responsiveness
- **Platform:** authentication, database, storage and authorization
- **AI:** multimodal extraction, structured outputs, recommendations and evaluations
- **Product logic:** matching rules, weather handling, feedback and local catalogue

Do not allow these areas to become isolated silos

Before parallel development, agree on:

- Shared data types
- API inputs and outputs
- Supported clothing categories
- AI response schemas
- Error formats
- Ownership rules
- Definition of a complete outfit
- Definition of a redundant purchase

Integrate work daily instead of waiting until the end of the project

## Engineering guidelines

- Read and apply `UNSLOP.md` to all writing produced for this project
- Never edit `AGENTS.md` without explicit human approval; present proposed edits clearly marked for review
- Inspect existing files before introducing new dependencies or architecture
- Reuse the repository's established patterns where reasonable
- Keep changes small and focused
- Avoid unrelated refactoring during the compressed build window
- Do not modify generated or synchronized reference files
- Never commit credentials or API keys
- Keep secrets in environment variables
- Provide an example environment file containing names but no secret values
- Validate inputs at both the interface and server boundary
- Keep AI prompts and schemas versioned in the repository
- Log failures without logging private images, secrets or excessive personal data
- Add automated tests for deterministic rules and authorization-sensitive logic
- Use seeded development data for repeatable demonstrations
- Document model choice, model parameters and technology stack decisions as they are made, since the milestone write-up requires justifications against alternatives

## Definition of done

A feature is complete only when:

- It works through the actual user interface
- It uses real authenticated user data
- Loading, empty, success and error states are handled
- Inputs and AI outputs are validated
- Authorization is enforced
- The feature works on mobile-sized screens
- Important deterministic logic has tests
- It has been integrated into the main user journey
- It can be demonstrated without manual database intervention
- Its limitations are communicated honestly

## Demo scenario

Prepare a stable seeded demonstration:

1) A user signs in
2) Their wardrobe contains several confirmed items
3) They add one new item using a photograph
4) The AI makes at least one imperfect classification
5) The user corrects it, demonstrating human control
6) The user requests an outfit for an outdoor Singapore event
7) The app recommends existing wardrobe items and explains its reasoning using the real Singapore forecast
8) The user rejects one result as too warm
9) The next result reflects that feedback
10) The user uploads a prospective purchase
11) The app finds a similar owned item and warns that the purchase may be redundant
12) The user sees evidence rather than an unexplained AI verdict

This scenario should remain functional throughout development

## Final product positioning

Wearabouts is not simply an AI that recommends clothing

It is a private, persistent wardrobe decision system that helps users:

- Understand what they own
- Make better use of existing clothes
- Dress appropriately for their Singapore context
- Learn from past outfit experiences
- Evaluate purchases against their real wardrobe
- Buy only when an item provides genuine additional value

When uncertain about scope, preserve this positioning
