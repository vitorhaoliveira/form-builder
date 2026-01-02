import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutSession, STRIPE_PRO_PRICE_ID } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    console.log("🔍 DEBUG - Create Checkout:");
    console.log("  → User ID:", session?.user?.id);
    console.log("  → User Email:", session?.user?.email);

    if (!session?.user?.id || !session?.user?.email) {
      console.log("❌ User not authenticated");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body;

    console.log("  → Received Price ID:", priceId);
    console.log("  → Expected Price ID:", STRIPE_PRO_PRICE_ID);

    // Validate price ID
    if (!priceId) {
      console.log("❌ No price ID provided");
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
    }

    if (!STRIPE_PRO_PRICE_ID) {
      console.log("❌ STRIPE_PRO_PRICE_ID not configured on server");
      return NextResponse.json({ 
        error: "Server configuration error: STRIPE_PRO_PRICE_ID not set" 
      }, { status: 500 });
    }

    if (priceId !== STRIPE_PRO_PRICE_ID) {
      console.log("❌ Price ID mismatch");
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    console.log("✅ Creating checkout session...");

    // Create checkout session
    const checkoutUrl = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      priceId,
    });

    if (!checkoutUrl) {
      console.log("❌ No checkout URL returned");
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    console.log("✅ Checkout session created:", checkoutUrl);
    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
