"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { hasFeature } from "@/lib/stripe";

interface ProFeatures {
  customTheme: boolean;
  hideBranding: boolean;
  captcha: boolean;
  unlimitedResponses: boolean;
}

export function useProFeatures() {
  const { data: session } = useSession();
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<ProFeatures>({
    customTheme: false,
    hideBranding: false,
    captcha: false,
    unlimitedResponses: false,
  });

  useEffect(() => {
    const fetchPlan = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/subscription");
        if (response.ok) {
          const data = await response.json();
          const userPlan = data.plan || "free";
          setPlan(userPlan);

          // Update features based on plan
          setFeatures({
            customTheme: hasFeature(userPlan, "customTheme"),
            hideBranding: hasFeature(userPlan, "hideBranding"),
            captcha: hasFeature(userPlan, "captcha"),
            unlimitedResponses: userPlan === "pro",
          });
        }
      } catch (error) {
        console.error("Error fetching plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [session]);

  const isPro = plan === "pro";
  const isFree = plan === "free";

  return {
    plan,
    isPro,
    isFree,
    loading,
    features,
    hasAccess: (feature: keyof ProFeatures) => features[feature],
  };
}
