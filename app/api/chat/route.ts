import { NextResponse } from "next/server";
import type OpenAI from "openai";
import {
  aiModel,
  getAiErrorDetails,
  getAiUnavailableMessage,
  openai,
} from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You are CodeCoach, an expert coding interview assistant. The user is solving a LeetCode problem. You can see their current code. Give concise, helpful guidance. Do NOT give away the full solution. Point out inefficiencies, bugs, or interview anti-patterns if you see them.";

type ChatRequestBody = {
  message?: string;
  code?: string;
  problemSlug?: string;
  sessionId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const message = body.message?.trim();
    const code = body.code?.trim();
    const problemSlug = body.problemSlug?.trim();
    const sessionId = body.sessionId?.trim();

    if (!message || !problemSlug || !sessionId) {
      return NextResponse.json(
        {
          error: "message, problemSlug, and sessionId are required.",
        },
        { status: 400 },
      );
    }

    if (!openai) {
      return NextResponse.json(
        {
          error: getAiUnavailableMessage("chat"),
        },
        { status: 503 },
      );
    }

    const problem = await prisma.problem.findUnique({
      where: {
        slug: problemSlug,
      },
    });

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found." },
        { status: 404 },
      );
    }

    const history = await prisma.chatMessage.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const problemContext = [
      `Problem title: ${problem.title}`,
      `Difficulty: ${problem.difficulty}`,
      `Description:\n${problem.description}`,
      `Examples:\n${JSON.stringify(problem.examples, null, 2)}`,
      `Constraints:\n${problem.constraints.join("\n")}`,
    ].join("\n\n");

    const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] =
      history.map((entry) =>
        entry.role === "assistant"
          ? {
              role: "assistant",
              content: entry.content,
            }
          : {
              role: "user",
              content: entry.content,
            },
      );

    const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "system",
        content: problemContext,
      },
      ...historyMessages,
      {
        role: "user",
        content: [
          `User message:\n${message}`,
          `Current code:\n${code || "No code provided yet."}`,
        ].join("\n\n"),
      },
    ];

    const completion = await openai.chat.completions.create({
      model: aiModel,
      messages: conversationMessages,
    });

    const assistantReply =
      completion.choices[0]?.message?.content?.trim() ||
      "I do not have feedback yet. Try asking again with a bit more detail.";

    await prisma.$transaction([
      prisma.session.upsert({
        where: {
          id: sessionId,
        },
        update: {},
        create: {
          id: sessionId,
          problemSlug,
        },
      }),
      prisma.chatMessage.create({
        data: {
          sessionId,
          role: "user",
          content: message,
        },
      }),
      prisma.chatMessage.create({
        data: {
          sessionId,
          role: "assistant",
          content: assistantReply,
        },
      }),
    ]);

    return NextResponse.json({ reply: assistantReply });
  } catch (error) {
    console.error("POST /api/chat failed", error);
    const errorDetails = getAiErrorDetails(error, "chat");

    return NextResponse.json(
      {
        error: errorDetails.message,
      },
      { status: errorDetails.status },
    );
  }
}
