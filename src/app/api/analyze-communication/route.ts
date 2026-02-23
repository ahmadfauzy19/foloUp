import { logger } from "@/lib/logger";
import {
  SYSTEM_PROMPT,
  getCommunicationAnalysisPrompt,
} from "@/lib/prompts/communication-analysis";
import { TextServiceClient } from "@google-ai/generativelanguage";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  logger.info("analyze-communication request received");

  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const gemini = new TextServiceClient({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const [result]: any = await gemini.generateText({
      model: "models/gemini-2.5-flash",
      prompt: {
        text: `${SYSTEM_PROMPT}\n\n${getCommunicationAnalysisPrompt(transcript)}`,
      },
    });

    const analysis = result?.candidates?.[0]?.content ?? "";

    logger.info("Communication analysis completed successfully");

    return NextResponse.json({ analysis: JSON.parse(analysis || "{}") }, { status: 200 });
  } catch (error) {
    logger.error("Error analyzing communication skills");

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
