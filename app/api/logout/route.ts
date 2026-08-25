import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/client/login", request.url), 303);
  response.cookies.set("dawaa_access", "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set("dawaa_refresh", "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set("dawaa_demo", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
