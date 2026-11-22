import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

type UserRole = "staff" | "parent";

function isUserRole(role: unknown): role is UserRole {
  return role === "staff" || role === "parent";
}

function redirectWithSession(
  request: NextRequest,
  path: string,
  sessionResponse: NextResponse,
) {
  const response = NextResponse.redirect(new URL(path, request.url));

  sessionResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  for (const headerName of ["cache-control", "expires", "pragma"]) {
    const value = sessionResponse.headers.get(headerName);
    if (value) response.headers.set(headerName, value);
  }

  return response;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isStaffRoute = pathname === "/staff" || pathname.startsWith("/staff/");
  const isParentRoute = pathname === "/parent" || pathname.startsWith("/parent/");
  const isLoginRoute = pathname === "/login";
  const isProtectedRoute = isStaffRoute || isParentRoute;
  const config = getSupabaseConfig();

  if (!config) {
    return isProtectedRoute
      ? NextResponse.redirect(new URL("/login", request.url))
      : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string") {
    return isProtectedRoute
      ? redirectWithSession(request, "/login", response)
      : response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const role = profile?.role;

  if (!isUserRole(role)) {
    return isProtectedRoute
      ? redirectWithSession(request, "/login", response)
      : response;
  }

  const rolePath = role === "staff" ? "/staff" : "/parent";

  if (isLoginRoute) {
    return redirectWithSession(request, rolePath, response);
  }

  if (isStaffRoute && role !== "staff") {
    return redirectWithSession(request, "/parent", response);
  }

  if (isParentRoute && role !== "parent") {
    return redirectWithSession(request, "/staff", response);
  }

  return response;
}
