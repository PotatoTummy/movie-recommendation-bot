import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  // 1. Extract client IP for rate limiting
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";

  // 2. Enforce Rate Limiter (Max 6 sessions per 15 minutes per IP)
  const rateLimit = checkRateLimit(ip, 6, 15 * 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: `Fair Usage Limit: You have reached the maximum number of sessions for now. Please wait ${rateLimit.resetInSeconds}s before starting a new room. This protects real-time voice AI compute for portfolio visitors.`,
        retryAfter: rateLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.resetInSeconds.toString(),
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // 3. Parse and sanitize room & username
  const rawRoom = req.nextUrl.searchParams.get("room") || "";
  const room = rawRoom.startsWith("cinebot-")
    ? rawRoom
    : `cinebot-${Math.random().toString(36).substring(2, 9)}`;

  const username =
    req.nextUrl.searchParams.get("username") ||
    `cinephile-${Math.floor(1000 + Math.random() * 9000)}`;

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: "LiveKit server credentials are not properly configured in .env.local" },
      { status: 500 }
    );
  }

  try {
    // 4. Create Access Token with a strict 10-minute (600s) TTL cap to avoid zombie sessions
    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: username,
      ttl: 600, // 10 minutes session duration limit
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json(
      {
        token,
        url: wsUrl,
        room,
        username,
        ttlSeconds: 600,
      },
      {
        headers: {
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error: any) {
    console.error("Error generating LiveKit token:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate room token" },
      { status: 500 }
    );
  }
}
