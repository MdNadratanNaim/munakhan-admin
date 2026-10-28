import { NextResponse } from "next/server";
import { createSessionCookie, passwordIsValid, sessionCookieHeader } from "@/lib/auth";

// Slows down password guessing: after 5 wrong passwords from one address, further attempts are refused for 15 minutes.
// The counter lives in this server instance only, so Cloudflare's rate limiting rule (see README) is the firm limit.
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; since: number }>();

function clientId(request: Request): string {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const id = clientId(request);
  const now = Date.now();
  const record = failures.get(id);
  if (record && now - record.since > WINDOW_MS) failures.delete(id);
  if ((failures.get(id)?.count ?? 0) >= MAX_FAILURES) {
    return NextResponse.json({ error: "Too many wrong passwords. Try again in 15 minutes." }, { status: 429, headers: { "Retry-After": "900" } });
  }
  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password.slice(0, 256) : "";
    if (!password || !(await passwordIsValid(password))) {
      const current = failures.get(id) ?? { count: 0, since: now };
      failures.set(id, { count: current.count + 1, since: current.since });
      await wait(700);
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    failures.delete(id);
    const response = NextResponse.json({ ok: true });
    response.headers.set("Set-Cookie", sessionCookieHeader(await createSessionCookie()));
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is not available right now." }, { status: 500 });
  }
}
