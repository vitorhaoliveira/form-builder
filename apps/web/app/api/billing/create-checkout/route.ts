import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutSession, STRIPE_PRO_PRICE_ID } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body;

    // Validate price ID
    if (!priceId || priceId !== STRIPE_PRO_PRICE_ID) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    // Create checkout session
    const checkoutUrl = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      priceId,
    });

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
