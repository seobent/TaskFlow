import { NextResponse, type NextRequest } from "next/server";

const localExpoOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      headers: createCorsHeaders(origin),
      status: 204,
    });
  }

  const response = NextResponse.next();
  const corsHeaders = createCorsHeaders(origin);

  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};

function createCorsHeaders(origin: string | null) {
  const headers = new Headers();

  if (origin && isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization,Content-Type,Accept",
  );

  return headers;
}

function isAllowedOrigin(origin: string) {
  if (process.env.NODE_ENV !== "production" && localExpoOriginPattern.test(origin)) {
    return true;
  }

  return origin === process.env.MOBILE_WEB_ORIGIN;
}
