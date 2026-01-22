import { useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await apiRequest("POST", "/api/track/pageview", { path: location });
      } catch (error) {
        // Silently fail - tracking shouldn't break the app
        console.debug("Page tracking failed:", error);
      }
    };

    trackPageView();
  }, [location]);
}
