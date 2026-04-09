import type { SessionFeaturesPayload } from "./sessionFeatures";

export type RiskCheckResponse = {
  riskLevel: "low" | "warning" | "high";
  confidence: number | null;
  featuresUsed: string[];
  checkedAt: string;
};

export class RiskCheckClientError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "RiskCheckClientError";
  }
}

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
    let message = "Risk check failed.";

    try {
      const data = (await response.json()) as { error?: unknown };
      if (typeof data?.error === "string" && data.error.trim().length > 0) {
        message = data.error;
      }
    } catch {
      const text = await response.text();
      if (text.trim().length > 0) {
        message = text;
      }
    }

    throw new RiskCheckClientError(message, response.status);
  }

  return response.json();
}
