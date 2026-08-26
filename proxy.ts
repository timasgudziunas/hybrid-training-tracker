import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isValidSessionToken } from "@/lib/auth/passphrase-cookie";

export const config = {
  // Everything except the unlock page/action and Next.js static assets.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|unlock).*)"],
};

export async function proxy(request: NextRequest) {
  const passphrase = process.env.APP_PASSPHRASE;

  if (!passphrase) {
    return new NextResponse(
      "APP_PASSPHRASE is not configured on the server. Set it in the environment to use this app.",
      { status: 500 }
    );
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await isValidSessionToken(token, passphrase);

  if (valid) {
    return NextResponse.next();
  }

  const unlockUrl = new URL("/unlock", request.url);
  unlockUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(unlockUrl);
}
