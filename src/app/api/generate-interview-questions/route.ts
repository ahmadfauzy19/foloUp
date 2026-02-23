import { logger } from "@/lib/logger";
import { SYSTEM_PROMPT, generateQuestionsPrompt } from "@/lib/prompts/generate-questions";
// import { TextServiceClient } from "@google-ai/generativelanguage";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(
      `${SYSTEM_PROMPT}\n\n${generateQuestionsPrompt(body)}`
    );

    const content = result.response.text();

    return NextResponse.json(
      {
        response: content,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("ERROR:", error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}

