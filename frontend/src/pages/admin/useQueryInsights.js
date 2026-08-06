import { useCallback, useState } from "react";
import { getQueryInsights } from "./adminApi";
import { goToLogin, isAdminSessionExpired, readApiResponse } from "./adminHelpers";

const EMPTY_INSIGHTS = { totalQueries: 0, statusCounts: {}, notFoundRate: 0, topNotFoundQuestions: [], topFoundPapers: [] };

export default function useQueryInsights() {
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  const [insightsWindowDays, setInsightsWindowDays] = useState(30);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const fetchInsights = useCallback(async (days = insightsWindowDays) => {
    setInsightsLoading(true);
    setInsightsError("");
    try {
      const response = await getQueryInsights(days);
      if (isAdminSessionExpired(response)) {
        goToLogin();
        return;
      }
      if (!response.ok) {
        setInsightsError("Could not load insights right now.");
        return;
      }
      setInsights(await readApiResponse(response));
    } catch {
      setInsightsError("Server connection failed");
    } finally {
      setInsightsLoading(false);
    }
  }, [insightsWindowDays]);

  const changeInsightsWindow = useCallback((days) => {
    setInsightsWindowDays(days);
    fetchInsights(days);
  }, [fetchInsights]);

  return {
    insights,
    insightsWindowDays,
    insightsLoading,
    insightsError,
    fetchInsights,
    changeInsightsWindow
  };
}
