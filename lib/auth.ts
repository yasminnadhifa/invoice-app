import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "./jwt";

export type AuthResult =
  | { payload: JwtPayload; authType: "jwt" }
  | { payload: null; authType: "apikey" }
  | { error: NextResponse };

export function authenticate(request: NextRequest): AuthResult {
  // Check API-KEY header first
  const apiKeyHeader = request.headers.get("api-key");
  const apiKey = process.env.API_KEY;

  if (apiKeyHeader) {
    if (apiKey && apiKeyHeader === apiKey) {
      return { payload: null, authType: "apikey" };
    }
    return {
      error: NextResponse.json({ message: "Invalid API key" }, { status: 401 }),
    };
  }

  // Fall through to JWT
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : request.cookies.get("token")?.value;

  if (!token) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const payload = verifyToken(token);
    return { payload, authType: "jwt" };
  } catch {
    return {
      error: NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }
}