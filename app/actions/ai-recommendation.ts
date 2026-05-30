"use server";

import { db } from "@/lib/db";
import {
  recommendationChats,
  recommendationMessages,
  recommendedDoctors,
  user,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getGeminiModel } from "@/lib/gemini-client";
import {
  SPECIALTIES,
  getRecommendationSystemPrompt,
} from "@/lib/prompts/recommendation";

const MAX_TURNS = 15;
const FORCE_RECOMMEND_AT_TURN = 12;

export async function createRecommendationChat() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const chatId = nanoid();
  await db.insert(recommendationChats).values({
    id: chatId,
    patientId: session.user.id,
    status: "active",
    messageCount: 0,
  });

  return chatId;
}

export async function sendRecommendationMessage(
  chatId: string,
  userMessage: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify chat belongs to user
  const chat = await db.query.recommendationChats.findFirst({
    where: eq(recommendationChats.id, chatId),
  });

  if (!chat || chat.patientId !== session.user.id) {
    throw new Error("Chat not found or unauthorized");
  }

  const currentTurns = Math.floor(chat.messageCount / 2);

  const shouldForceRecommendation = currentTurns >= 12;

  const systemPrompt = getRecommendationSystemPrompt(shouldForceRecommendation);

  if (currentTurns >= MAX_TURNS) {
    throw new Error(
      "Maximum conversation turns reached. Please start a new chat.",
    );
  }

  // Save user message
  await db.insert(recommendationMessages).values({
    id: nanoid(),
    chatId,
    role: "patient",
    content: userMessage,
  });

  // Get conversation history
  const messages = await db.query.recommendationMessages.findMany({
    where: eq(recommendationMessages.chatId, chatId),
    orderBy: [recommendationMessages.createdAt],
  });

  // Build chat history for Gemini
  const chatHistory = messages.map((msg) => ({
    role: msg.role === "patient" ? ("user" as const) : ("model" as const),
    parts: [{ text: msg.content }],
  }));

  // Get AI response from Gemini
  const model = getGeminiModel(systemPrompt);
  const chat_session = model.startChat({
    history: chatHistory.slice(0, -1), // Exclude the last user message we just added
  });

  const messageToSend = shouldForceRecommendation
    ? `${userMessage}\n\nIMPORTANT: You have gathered enough information. Do not ask any more questions. Recommend 1-3 specialties now using only the approved specialty names. End your response with a JSON block like {"specialties":["Specialty Name"]}.`
    : userMessage;

  const result = await chat_session.sendMessage(messageToSend);
  const aiResponse = result.response.text();

  // Save AI response
  await db.insert(recommendationMessages).values({
    id: nanoid(),
    chatId,
    role: "assistant",
    content: aiResponse,
  });

  // Update message count
  await db
    .update(recommendationChats)
    .set({ messageCount: chat.messageCount + 2, updatedAt: new Date() })
    .where(eq(recommendationChats.id, chatId));

  // Extract specialties if present in response
  let recommendedSpecialties: string[] = [];
  try {
    const jsonMatch = aiResponse.match(/\{"specialties":\s*\[(.*?)\]\}/);
    if (jsonMatch) {
      const specialtiesStr = jsonMatch[0];
      const parsed = JSON.parse(specialtiesStr);
      recommendedSpecialties = parsed.specialties.filter((s: string) =>
        SPECIALTIES.includes(s),
      );
    }
  } catch (e) {
    // No JSON found, continue without extracting specialties
  }

  // If specialties were recommended, find matching doctors
  if (recommendedSpecialties.length > 0) {
    const matchingDoctors = await db.query.user.findMany({
      where: and(eq(user.userType, "doctor"), eq(user.isAvailable, true)),
    });

    const filtered = matchingDoctors.filter((doc) =>
      recommendedSpecialties.includes(doc.specialty || ""),
    );

    // Save recommended doctors
    for (let i = 0; i < filtered.length && i < 5; i++) {
      await db.insert(recommendedDoctors).values({
        id: nanoid(),
        chatId,
        doctorId: filtered[i].id,
        matchReason: `Specializes in ${filtered[i].specialty}`,
        rank: i + 1,
      });
    }
  }

  return {
    aiResponse,
    recommendedSpecialties,
  };
}

export async function getRecommendationChatHistory(chatId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const chat = await db.query.recommendationChats.findFirst({
    where: eq(recommendationChats.id, chatId),
  });

  if (!chat || chat.patientId !== session.user.id) {
    throw new Error("Chat not found or unauthorized");
  }

  const messages = await db.query.recommendationMessages.findMany({
    where: eq(recommendationMessages.chatId, chatId),
    orderBy: [recommendationMessages.createdAt],
  });

  return messages;
}

export async function getRecommendedDoctorsForChat(chatId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const chat = await db.query.recommendationChats.findFirst({
    where: eq(recommendationChats.id, chatId),
  });

  if (!chat || chat.patientId !== session.user.id) {
    throw new Error("Chat not found or unauthorized");
  }

  const recommendations = await db.query.recommendedDoctors.findMany({
    where: eq(recommendedDoctors.chatId, chatId),
    orderBy: [recommendedDoctors.rank],
  });

  // Fetch full doctor details for each recommendation
  const result = await Promise.all(
    recommendations.map(async (rec) => {
      const doctor = await db.query.user.findFirst({
        where: eq(user.id, rec.doctorId),
      });
      return {
        ...rec,
        doctor,
      };
    }),
  );

  return result.filter((r) => r.doctor);
}
