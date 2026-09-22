import type { Metadata } from "next";
import Link from "next/link";
import "../landing.css";
import "../onboarding/onboarding.css";

export const metadata: Metadata = {
  title: "Privacy and your wardrobe",
  alternates: { canonical: "/privacy" },
};
export default function PrivacyPage() {
  return (
    <main className="drape-public onboarding-page">
      <header className="onboarding-header">
        <Link className="onboarding-wordmark" href="/">
          Wearabouts
        </Link>
        <Link href="/login">Sign in</Link>
      </header>
      <article className="privacy-copy">
        <h1>Your wardrobe stays yours.</h1>
        <p>
          Wearabouts stores your wardrobe photos and preferences in your private
          account. Other users cannot browse them. Signed-in access and database
          ownership rules protect your wardrobe.
        </p>
        <h2>What we use</h2>
        <p>
          We use the preferences you choose, your confirmed clothing details and
          feedback to suggest outfits and assess potential purchases. When you
          request AI analysis, the selected image and relevant information are
          sent to Google Gemini. Photos can contain personal details, so upload
          only what you want analysed.
        </p>
        <h2>Measurements and sizing</h2>
        <p>
          Body measurements you enter are stored on your account and only you
          can read them. They are never sent to an AI model: sizes are worked
          out in the app by comparing your measurements with brand size
          charts. If you upload a shopping screenshot to find your size, it is
          sent to Google Gemini to read the brand, product and size chart, and
          Wearabouts does not save it. Size suggestions are guidance, not a
          guarantee. You can edit or delete your measurements at any time
          from your profile.
        </p>
        <h2>Your choices</h2>
        <p>
          AI details are suggestions. Review and correct them before saving. You
          can edit preferences in your profile and delete individual clothing
          items and their photos from your wardrobe. Full account deletion is
          not available in the app yet.
        </p>
        <h2>Optional usage analytics</h2>
        <p>
          If enabled by the team and accepted by you, Google Analytics measures
          page visits, setup steps and completed wardrobe, outfit and purchase actions so we can find steps that need improvement. We
          do not send your email, name, photos, clothing IDs or preference
          answers as analytics events. You can change your analytics choice
          below. Essential sign-in cookies are separate.
        </p>
        <h2>During the beta</h2>
        <p>
          Wearabouts is a university project in active development. Do not
          upload sensitive documents or images you do not have permission to
          use.
        </p>
        <Link className="onboarding-secondary" href="/">
          Back to Wearabouts
        </Link>
      </article>
    </main>
  );
}
