import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((request) => {
  if (!request.auth) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
};
