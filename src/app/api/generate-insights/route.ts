import { logger } from "@/lib/logger";
import { SYSTEM_PROMPT, createUserPrompt } from "@/lib/prompts/generate-insights";
import { InterviewService } from "@/services/interviews.service";
import { ResponseService } from "@/services/responses.service";
import { TextServiceClient } from "@google-ai/generativelanguage";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  logger.info("generate-insights request received");
  const body = await req.json();

  const responses = await ResponseService.getAllResponses(body.interviewId);
  const interview = await InterviewService.getInterviewById(body.interviewId);

  let callSummaries = "";
  if (responses) {
    for (const response of responses) {
      callSummaries += response.details?.call_analysis?.call_summary;
    }
  }

  const gemini = new TextServiceClient({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    const prompt = createUserPrompt(
      callSummaries,
      interview.name,
      interview.objective,
      interview.description,
    );

    const [res]: any = await gemini.generateText({
      model: "models/gemini-2.5-flash",
      prompt: {
        text: `${SYSTEM_PROMPT}\n\n${prompt}`,
      },
    });

    const content = res?.candidates?.[0]?.content ?? "";
    const insightsResponse = JSON.parse(content);

    await InterviewService.updateInterview(
      { insights: insightsResponse.insights },
      body.interviewId,
    );

    logger.info("Insights generated successfully");

    return NextResponse.json(
      {
        response: content,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error generating insights");

    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
