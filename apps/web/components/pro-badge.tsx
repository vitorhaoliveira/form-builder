"use client";

import { Crown } from "lucide-react";
import { Badge } from "@submitin/ui/components/badge";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function ProBadge() {
  const { data: session } = useSession();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

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
          setIsPro(data.plan === "pro");
        }
      } catch (error) {
        console.error("Error fetching plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [session]);

  if (loading || !session?.user) {
    return null;
  }

  if (!isPro) {
    return (
      <Badge variant="outline" className="text-xs">
        Free
      </Badge>
    );
  }

  return (
    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-xs">
      <Crown className="h-3 w-3 mr-1" />
      Pro
    </Badge>
  );
}
