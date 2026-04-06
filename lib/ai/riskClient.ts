import type { SessionFeaturesPayload } from "./sessionFeatures";

export type RiskCheckResponse = {
  riskLevel: "low" | "warning" | "high";
  confidence: number | null;
  featuresUsed: string[];
  checkedAt: string;
};

export async function checkSessionRisk(
  payload: SessionFeaturesPayload
): Promise<RiskCheckResponse> {
  const response = await fetch("/api/risk-check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Risk check failed: ${text}`);
  }

  return response.json();
}
