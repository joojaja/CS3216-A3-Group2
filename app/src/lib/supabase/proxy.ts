import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/wardrobe", "/planner", "/evaluator", "/profile"];

// Name of the dev-only session cookie, set by the login form when Supabase
// env vars are missing. Never consulted when Supabase is configured.
export const DEV_AUTH_COOKIE = "dev_auth";

function guard(
  request: NextRequest,
  response: NextResponse,
  authenticated: boolean,
) {
  const path = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (!authenticated && needsAuth) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (authenticated && path === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/wardrobe";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

// Refreshes the Supabase session cookie and enforces route-level auth.
// Real authorization is still enforced by Postgres RLS. This only redirects.
//
// When Supabase env vars are absent (frontend-only development), the
// dev_auth cookie set via the test credentials acts as a stand-in session.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    const devAuthed = request.cookies.get(DEV_AUTH_COOKIE)?.value === "1";
    return guard(request, response, devAuthed);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return guard(request, response, Boolean(user));
}
