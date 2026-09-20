# Competitor onboarding review

The product name is Wearabouts, as confirmed from the supplied design reference. Some internal identifiers retain the older Drape prefix for compatibility.

This review covers the 24 supplied screenshots in `competitor images/`. The filenames below are evidence from the repository. They show two different wardrobe-app experiences, so the observations are separated before the Wearabouts recommendations.

## What the screenshots show

### Cloey's long setup flow

`IMG_67F3ED026F2A-1.jpeg` through `IMG_67F3ED026F2A-18.jpeg` show a sequential Cloey onboarding flow. Each screen has a back arrow, a thin progress bar, one main question and a large bottom action. The questions are:

- `-1`: name entry.
- `-2`: womenswear, menswear or both.
- `-3`: age range.
- `-4`: acquisition source, including Instagram, TikTok, friends or family, App Store, YouTube and Reddit.
- `-5`: visual theme selection: Classic, Ruby, Emerald or Sapphire.
- `-6`: username entry with live availability feedback.
- `-7`: wardrobe-size estimate with a slider from 10 to 300+ items.
- `-8`, `-9` and `-10`: visual aesthetic cards, including Academia, Blokecore, Cityboy, Gorpcore, Grunge, Minimalist, Old Money, Punk, Streetwear and Workwear.
- `-11`: the user's main closet problem.
- `-12`: an estimate of the number of unique outfits in rotation, using a slider.
- `-13`: a "quick math" persuasion screen that presents 80% and $250 figures.
- `-14`: a closet-utilisation comparison between the user today and the user with Cloey.
- `-15`: a promise of three daily outfit ideas using owned clothes, followed by an example notification.
- `-16` and `-17`: example outfits presented as swipeable cards. The instruction says to swipe right to like and left to pass.
- `-18`: a closet preview followed by "Level up my closet."

The visual system stays consistent across the sequence. It uses a white or pale background, heavy dark type, deep green selected states and primary buttons, pale lavender-grey cards, rounded corners and a recurring illustrated mascot. The aesthetic choices rely on large clothing images rather than text-only tags. The action button is fixed near the bottom of the viewport.

The flow keeps one decision on each screen, which lowers the reading burden. It also asks for many answers before the first wardrobe item. The progress bar does not show a number of steps or an estimated time. The source and aesthetic lists extend below the first viewport, so a user must scroll. The precise-looking "80%" and "$250" claims are persuasive, but the screenshots do not show how those figures were calculated.

`IMG_67F3ED026F2A-19.jpeg` through `IMG_67F3ED026F2A-21.jpeg` are product-story panels rather than setup questions. They show a personal style companion, daily outfit inspiration from owned clothes, closet statistics, style discovery and social proof.

### Acloset's first-use guidance

`IMG_67F3ED026F2A-22.jpeg` shows a dimmed home screen with an instructional overlay pointing at a large central `+` button. The message says to upload a first outfit and that the app will detect its items.

`IMG_67F3ED026F2A-23.jpeg` shows the result of tapping `+`: a bottom sheet with Camera, Upload photos and Not now. The user can postpone the upload.

`IMG_67F3ED026F2A-24.jpeg` shows a common-item shortcut. The user can tap familiar tops such as white, black and grey T-shirts, cardigans, hoodies, henleys and polos, then continue or skip. This gives the user a way to seed a closet without taking photographs.

## What Wearabouts should take from this

Wearabouts's current code already uses the strongest parts of these patterns in a shorter four-step flow. `app/src/components/onboarding-flow.tsx` labels the steps "Your style," "Your colours," "Your day" and "Your first item," shows "Step n of 4," and says that answers are optional. `app/src/lib/onboarding.ts` keeps the preference set small: styles, preferred colours, disliked colours, common occasions, optional notes and optional clothing sizes. The upload screen then asks for one existing piece and tells the user that suggested details can be reviewed and corrected.

The chosen preference set is appropriate for Wearabouts's first confirmed item because each field affects a later wardrobe decision:

- Styles: Minimalist, Casual, Smart casual, Streetwear, Classic and Sporty.
- Colours to reach for and colours to avoid.
- Common occasions: Campus, Work, Everyday outings, Dinner out, Celebrations and Outdoor plans.
- Optional notes for constraints such as covered shoulders, avoiding wool or carrying a layer for cold lecture halls.
- Optional top, bottom and shoe sizes. The interface explains that a photo cannot tell Wearabouts a user's fit.

The current flow should remain short. Demographic questions, acquisition-source questions and theme selection add setup cost without helping Wearabouts classify the first garment. Optional choices should stay skippable, with "Finish later" available in the header and an explicit "Continue without selecting anything" message.

The first-item flow should keep this order:

1. Explain that one item is enough to begin and that wardrobe photos are private to the signed-in account.
2. Accept a photo, show a preview and communicate analysis progress.
3. Display the AI's suggested attributes in editable controls.
4. Mark uncertain fields, especially material cues, colour and ambiguous categories.
5. Save only the values the user confirms.
6. Show the saved item and offer the wardrobe as the next step.

The existing `ItemUploader` and attribute editor support this direction. The app's analysis schema includes category, subcategory, colours, pattern, visible material cues, formality, layering role, weather tags and uncertainty fields. This is a better fit for Wearabouts than an opaque "detected" label because the user's confirmation remains authoritative.

For the web layout, keep the competitor's clear cards and strong primary action but use Wearabouts's existing paper, ink, coral and olive tokens from `design.md`. On desktop, a narrow form beside the privacy and value message works well. On mobile, keep the step label and action visible without covering the last choice. Use local context in the choices, such as campus, a warm outdoor lunch, rain and cold lecture halls, rather than importing Cloey's seasonal Western styling.

Avoid unsupported savings or utilisation numbers during setup. If Wearabouts later shows a statistic, record the calculation and label it as the user's own observed data. The first successful confirmation should provide the reward: "Your wardrobe starts here," followed by the saved item and a clear invitation to add another piece or open the wardrobe.
