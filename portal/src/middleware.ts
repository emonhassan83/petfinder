import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authKey } from "@/constant/authKey";

const AuthRoutes = ["/login", "/register"];
//* Matched EXACTLY (any role may open them); every other /dashboard/* path goes through the role rules
const commonPrivateRoutes = ["/dashboard", "/dashboard/profile"];

const roleHome: Record<string, string> = {
  USER: "/dashboard/user",
  ADMIN: "/dashboard/admin",
  SUPER_ADMIN: "/dashboard/admin",
  OWNER: "/dashboard/shelter",
  SHELTER: "/dashboard/shelter",
  SHELTER_MEMBER: "/dashboard/shelter",
};

const roleBasedPrivateRoutes: Record<string, RegExp[]> = {
  USER: [/^\/dashboard\/user(\/|$)/],
  ADMIN: [/^\/dashboard\/admin(\/|$)/],
  SUPER_ADMIN: [/^\/dashboard\/admin(\/|$)/],
  OWNER: [/^\/dashboard\/shelter(\/|$)/],
  SHELTER: [/^\/dashboard\/shelter(\/|$)/],
  SHELTER_MEMBER: [/^\/dashboard\/shelter(\/|$)/],
};

//* Verifies signature (HS256, shared JWT_SECRET) and expiry. Returns the role, or null when the
//* token is invalid, expired, or a special-purpose token (email verification / reset).
const verifyRole = async (token: string): Promise<string | null> => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null; //* fail closed when misconfigured
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    if (payload.purpose || typeof payload.role !== "string" || !payload.userId) return null;
    return payload.role;
  } catch {
    return null;
  }
};

const toLogin = (request: NextRequest, clearCookie: boolean) => {
  const url = new URL("/login", request.url);
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    url.searchParams.set("redirect", request.nextUrl.pathname);
  }
  const res = NextResponse.redirect(url);
  if (clearCookie) res.cookies.delete(authKey);
  return res;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = AuthRoutes.includes(pathname);
  const accessToken = request.cookies.get(authKey)?.value;

  if (!accessToken) {
    return isAuthRoute ? NextResponse.next() : toLogin(request, false);
  }

  const role = await verifyRole(accessToken);

  if (!role) {
    //* invalid/expired token: drop the stale cookie; auth pages stay reachable
    if (isAuthRoute) {
      const res = NextResponse.next();
      res.cookies.delete(authKey);
      return res;
    }
    return toLogin(request, true);
  }

  const home = roleHome[role] ?? "/dashboard/profile";

  //* already signed in: send auth pages and the bare /dashboard to the role's dashboard
  if (isAuthRoute || pathname === "/dashboard") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (commonPrivateRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const routes = roleBasedPrivateRoutes[role] ?? [];
  if (routes.some((route) => route.test(pathname))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(home, request.url));
}

export const config = {
  matcher: ["/login", "/register", "/dashboard", "/dashboard/:path*"],
};
