import type { Gender } from "@/lib/profile-gender";

export type OnboardingProfile = {
  display_name: string | null;
  gender: Gender | null;
  preferred_styles: string[];
  preferred_colours: string[];
  disliked_colours: string[];
  common_occasions: string[];
  preference_notes: string | null;
  sizes: { top?: string; bottom?: string; shoes?: string } | null;
};

export const emptyOnboardingProfile: OnboardingProfile = {
  display_name: "",
  gender: null,
  preferred_styles: [],
  preferred_colours: [],
  disliked_colours: [],
  common_occasions: [],
  preference_notes: "",
  sizes: {},
};

export const styleOptions = [
  "Minimalist",
  "Casual",
  "Smart casual",
  "Streetwear",
  "Classic",
  "Sporty",
];
export const occasionOptions = [
  "Campus",
  "Work",
  "Everyday outings",
  "Dinner out",
  "Celebrations",
  "Outdoor plans",
];
export const colourOptions = [
  ["Black", "#292b28"],
  ["White", "#ffffff"],
  ["Cream", "#e9dfc8"],
  ["Grey", "#9b9e99"],
  ["Navy", "#303e56"],
  ["Blue", "#86a5bf"],
  ["Green", "#78806a"],
  ["Brown", "#927156"],
  ["Pink", "#d8a6a1"],
  ["Red", "#ad5454"],
] as const;
