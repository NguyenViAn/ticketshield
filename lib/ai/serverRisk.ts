import type { SessionFeaturesPayload } from "./sessionFeatures";

export type RiskLevel = "low" | "warning" | "high";

export type ServerRiskCheckResult = {
  riskLevel: RiskLevel;
  confidence: number | null;
  featuresUsed: string[];
  checkedAt: string;
};

export class RiskServiceError extends Error {
  constructor(message: string, public readonly status = 500) {
    super(message);
    this.name = "RiskServiceError";
  }
}

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000/predict";
const RISK_TIMEOUT_MS = 5_000;

function normalizeRiskLevel(value: unknown): RiskLevel {
  if (value === "high" || value === "warning" || value === "low") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();

    if (normalized === "high" || normalized === "warning" || normalized === "low") {
      return normalized;
    }
  }

  return "low";
}

export async function requestServerRiskCheck(
  payload: SessionFeaturesPayload,
  timeoutMs = RISK_TIMEOUT_MS
): Promise<ServerRiskCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(PYTHON_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new RiskServiceError(`Python AI service returned an error: ${errorText}`, 502);
    }

    const result = await response.json();

    return {
      riskLevel: normalizeRiskLevel(result?.riskLevel),
      confidence: typeof result?.confidence === "number" ? result.confidence : null,
      featuresUsed: Array.isArray(result?.featuresUsed) ? result.featuresUsed.map(String) : [],
      checkedAt,
    };
  } catch (error) {
    if (error instanceof RiskServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new RiskServiceError("Python AI service timed out.", 504);
    }

    throw new RiskServiceError("Failed to reach Python AI service.", 500);
  } finally {
    clearTimeout(timeout);
  }
}
