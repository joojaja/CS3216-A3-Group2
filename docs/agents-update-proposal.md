# Proposed AGENTS.md naming update

This is a proposal only. AGENTS.md has not been edited. Its existing rule requires approval of exact changes. The diff below contains all proposed edits, including the outdated logo milestone. No product scope or teammate ownership rule changes.

```diff
--- AGENTS.md current
+++ AGENTS.md proposed
@@ -7,14 +7,14 @@
 1) **Read UNSLOP.md first** Every agent must read and process `UNSLOP.md` in the repository root and apply it to all user-facing text, documentation, write-ups and marketing copy it produces
 2) **Never edit this file autonomously** Agents must not directly edit `AGENTS.md` under any circumstances. Any proposed change to this file requires explicit human approval. When proposing a change, present the exact edit clearly marked as a proposal (show the location, the current text and the replacement text) and wait for the human to approve before applying it
 3) **Check the team before starting a feature** Before implementing any feature, inspect the GitHub repository branches and open pull requests (for example `git fetch` then `git branch -a`, and review open PRs) to check whether a teammate is already working on that feature. If someone is, highlight this clearly to the user, name the branch or PR, and coordinate instead of duplicating work
-4) **The product is called Drape** Refer to it as `Drape` everywhere in code, copy and documentation. The name was confirmed on 16 September 2026, and the logo is still to be designed
+4) **The product is called Wearabouts** Refer to it as `Wearabouts` everywhere in code, copy and documentation. The supplied design document defines the visual identity. The name was reconfirmed on 20 September 2026.
 5) **Respect the deadline** The web application must be fully completed by 23 September 2026. Plan and scope work around that date, not the original two-week estimate
 
 ## Project overview
 
-This project is a university web application called **Drape**
-
-Drape is a wardrobe-first clothing assistant for users in Singapore. It helps users make better use of clothes they already own before recommending new purchases
+This project is a university web application called **Wearabouts**
+
+Wearabouts is a wardrobe-first clothing assistant for users in Singapore. It helps users make better use of clothes they already own before recommending new purchases
 
 The primary user journey is:
 
@@ -61,7 +61,7 @@
 
 ### Phase 4: design
 
-- **Name and logo:** choose a product name and create a logo with reasoning → the name is Drape, chosen because the product drapes clothes you already own into outfits. The logo is still to be designed and its reasoning documented
+- **Name and logo:** the product name is Wearabouts. The supplied reference mark combines a W and a clothes hanger. Document the naming rationale and credit the reference artwork in the milestone write-up
 - **Technology stack:** justify UI, database, web server, hosting and authentication choices against alternatives → document decisions as they are made
 - **User experience:** describe three common workflows and why they were chosen → covered by the user journey, Demo scenario and Recommended application pages
 - **AI-specific UI:** show UI decisions made because the app uses AI, beyond trivial disclaimers → covered by editable AI attributes, uncertainty display, suggest-accept flows and feedback controls in the User experience requirements
@@ -125,7 +125,7 @@
 - Whether it fills a genuine wardrobe gap
 - Whether they will realistically wear it
 
-Drape reduces this decision-making burden by building a persistent understanding of the user's wardrobe and preferences
+Wearabouts reduces this decision-making burden by building a persistent understanding of the user's wardrobe and preferences
 
 This section is the answer to the compulsory ungraded problem-statement milestone
 
@@ -171,9 +171,9 @@
 - **UI and UX:** dense grids, stock icons and unstyled component kits. Functional but forgettable
 - **What to learn and improve:** the design bar in this category is low, so a focused, well-explained, locally grounded experience is a clear differentiator
 
-### How Drape competes
-
-Drape should learn from competitor UI/UX, colour schemes and features, then go further:
+### How Wearabouts competes
+
+Wearabouts should learn from competitor UI/UX, colour schemes and features, then go further:
 
 - Wardrobe-first recommendations with visible reasoning, not unexplained verdicts
 - User-confirmed AI attributes, so errors are correctable instead of silently trusted
@@ -917,7 +917,7 @@
 
 ## Final product positioning
 
-Drape is not simply an AI that recommends clothing
+Wearabouts is not simply an AI that recommends clothing
 
 It is a private, persistent wardrobe decision system that helps users:
 
```
