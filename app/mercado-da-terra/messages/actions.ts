"use server";

import {
  startConversationAction,
  sendMessageAction,
  markAsReadAction,
} from "@/lib/marketplace/mensagens-actions";

export async function startConversation(formData: FormData) {
  return startConversationAction("mercado-da-terra", "messages", formData);
}

export async function sendMessage(formData: FormData) {
  return sendMessageAction("mercado-da-terra", "messages", formData);
}

export async function markAsRead(conversationId: number) {
  return markAsReadAction("mercado-da-terra", "messages", conversationId);
}
