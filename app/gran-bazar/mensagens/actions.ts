"use server";

import {
  startConversationAction,
  sendMessageAction,
  markAsReadAction,
} from "@/lib/marketplace/mensagens-actions";

export async function startConversation(formData: FormData) {
  return startConversationAction("gran-bazar", "mensagens", formData);
}

export async function sendMessage(formData: FormData) {
  return sendMessageAction("gran-bazar", "mensagens", formData);
}

export async function markAsRead(conversationId: number) {
  return markAsReadAction("gran-bazar", "mensagens", conversationId);
}
