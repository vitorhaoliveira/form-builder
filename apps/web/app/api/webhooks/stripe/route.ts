import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@submitin/database";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("📥 Stripe webhook received:", event.type);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✅ Checkout session completed:", session.id);

        if (session.mode === "subscription") {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.metadata?.userId || session.client_reference_id;

          if (!userId) {
            console.error("❌ No userId found in session metadata");
            break;
          }

          // Get subscription details
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);

          // Update user with subscription info
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "pro",
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: subscription.items.data[0]?.price.id || "",
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });

          // Create subscription record
          await prisma.subscription.create({
            data: {
              userId,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
              stripePriceId: subscription.items.data[0]?.price.id || "",
              stripeCurrentPeriodStart: new Date(subscription.current_period_start * 1000),
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              status: subscription.status,
              plan: "pro",
            },
          });

          console.log("✅ User upgraded to PRO:", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription: any = event.data.object;
        console.log("🔄 Subscription updated:", subscription.id);

        // Find user by subscription ID
        const user = await prisma.user.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
          console.error("❌ User not found for subscription:", subscription.id);
          break;
        }

        // Update user subscription status
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: subscription.status === "active" ? "pro" : "free",
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });

        // Update subscription record
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            stripeCurrentPeriodStart: new Date(subscription.current_period_start * 1000),
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          },
        });

        console.log("✅ Subscription updated for user:", user.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription: any = event.data.object;
        console.log("❌ Subscription deleted:", subscription.id);

        // Find user by subscription ID
        const user = await prisma.user.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
          console.error("❌ User not found for subscription:", subscription.id);
          break;
        }

        // Downgrade user to free plan
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "free",
            stripeCurrentPeriodEnd: null,
          },
        });

        // Update subscription record
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: "canceled",
            canceledAt: new Date(),
          },
        });

        console.log("✅ User downgraded to Free:", user.id);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice: any = event.data.object;
        console.log("💰 Payment succeeded:", invoice.id);

        if (invoice.subscription) {
          const subscription: any = await stripe.subscriptions.retrieve(invoice.subscription as string);

          const user = await prisma.user.findUnique({
            where: { stripeSubscriptionId: subscription.id },
          });

          if (user) {
            // Record payment
            await prisma.paymentHistory.create({
              data: {
                userId: user.id,
                stripePaymentIntentId: invoice.payment_intent as string,
                stripeInvoiceId: invoice.id,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: "succeeded",
                description: invoice.lines.data[0]?.description || "Pro Subscription",
              },
            });

            console.log("✅ Payment recorded for user:", user.id);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice: any = event.data.object;
        console.log("❌ Payment failed:", invoice.id);

        if (invoice.subscription) {
          const subscription: any = await stripe.subscriptions.retrieve(invoice.subscription as string);

          const user = await prisma.user.findUnique({
            where: { stripeSubscriptionId: subscription.id },
          });

          if (user) {
            // Record failed payment
            await prisma.paymentHistory.create({
              data: {
                userId: user.id,
                stripePaymentIntentId: (invoice.payment_intent as string) || "",
                stripeInvoiceId: invoice.id,
                amount: invoice.amount_due,
                currency: invoice.currency,
                status: "failed",
                description: "Payment failed",
              },
            });

            console.log("⚠️ Failed payment recorded for user:", user.id);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
