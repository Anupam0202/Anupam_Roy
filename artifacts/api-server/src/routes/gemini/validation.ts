const MAX_CHAT_CONTENT_LENGTH = 1_500;
const MAX_CHAT_HISTORY_ITEMS = 8;

interface ChatHistoryItem {
  role?: unknown;
  content?: unknown;
}

export interface NormalizedChatPayload {
  content: string;
  history: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
}

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.trim().slice(0, MAX_CHAT_CONTENT_LENGTH)
    : "";
}

export function isJsonContentType(value: string | undefined) {
  return value?.split(";")[0]?.trim().toLowerCase() === "application/json";
}

export function normalizeChatPayload(
  body: unknown,
): NormalizedChatPayload | null {
  const candidate =
    body && typeof body === "object"
      ? (body as { content?: unknown; history?: unknown })
      : {};
  const content = normalizeText(candidate.content);
  if (!content) return null;

  const history = Array.isArray(candidate.history)
    ? candidate.history
        .filter(
          (item: ChatHistoryItem) =>
            item &&
            typeof item === "object" &&
            (item.role === "user" || item.role === "assistant"),
        )
        .slice(-MAX_CHAT_HISTORY_ITEMS)
        .map((item: ChatHistoryItem) => ({
          role:
            item.role === "assistant" ? ("model" as const) : ("user" as const),
          content: normalizeText(item.content),
        }))
        .filter((item) => item.content)
        .map((item) => ({ role: item.role, parts: [{ text: item.content }] }))
    : [];

  return { content, history };
}
