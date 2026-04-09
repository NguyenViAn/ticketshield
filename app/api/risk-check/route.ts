import { NextRequest, NextResponse } from "next/server";

import type { SessionFeaturesPayload } from "@/lib/ai/sessionFeatures";
import { RiskServiceError, requestServerRiskCheck } from "@/lib/ai/serverRisk";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SessionFeaturesPayload;
    const result = await requestServerRiskCheck(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Risk check API error:", error);

    if (error instanceof RiskServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to check session risk" },
      { status: 500 }
    );
  }
}
