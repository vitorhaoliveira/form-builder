import type { NextRequest } from "next/server";

// Dynamic import to avoid build-time initialization issues
async function getHandlers() {
  const { handlers } = await import("@/lib/auth");
  return handlers;
}

export async function GET(request: NextRequest) {
  const handlers = await getHandlers();
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const handlers = await getHandlers();
  return handlers.POST(request);
}

