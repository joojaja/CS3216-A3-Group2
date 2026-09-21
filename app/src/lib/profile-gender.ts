export const GENDER_VALUES = ["male", "female", "others"] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "others", label: "Others" },
];

export function isMissingGenderColumn(
  error: { code?: string; message?: string } | null,
) {
  if (!error) return false;
  return (
    (error.code === "PGRST204" || error.code === "42703") &&
    /gender/i.test(error.message ?? "")
  );
}
