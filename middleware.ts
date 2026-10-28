import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";

// Crawlers, AI scrapers and scripted clients. Nothing here is meant for them, so they get a plain 403.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|scrape|fetch|python-requests|python-urllib|aiohttp|httpx|curl|wget|libwww|go-http-client|okhttp|java\/|scrapy|headless|phantom|gptbot|chatgpt|claude|anthropic|perplexity|ccbot|bytespider|amazonbot|petalbot|ahrefs|semrush|mj12|dotbot|facebookexternalhit|archive\.org|ia_archiver|meta-externalagent|google-extended|applebot/i;

function deny(): NextResponse {
  return new NextResponse("Forbidden", { status: 403, headers: { "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "no-store" } });
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_PATTERN.test(userAgent)) return deny();

  // A form or script on another site must not be able to act with the signed-in person's cookie.
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== request.nextUrl.host) return deny();
  }

  if (pathname === "/login" || pathname.startsWith("/api/auth/")) return NextResponse.next();

  const authenticated = await isValidSession(request.cookies.get(AUTH_COOKIE)?.value);
  if (authenticated) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  const next = `${pathname}${search}`;
  if (next !== "/") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|robots.txt|vendor/|api/live/asset/).*)"]
};
