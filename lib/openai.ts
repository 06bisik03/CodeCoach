import OpenAI from "openai";

export type AiProvider = "ollama" | "openai";
export type AiFeature = "chat" | "analysis";

const rawProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
const openAiApiKey = process.env.OPENAI_API_KEY?.trim();
const openAiBaseUrl = process.env.OPENAI_BASE_URL?.trim();
const defaultOllamaBaseUrl = "http://127.0.0.1:11434";
const configuredOllamaBaseUrl =
  process.env.OLLAMA_BASE_URL?.trim() || defaultOllamaBaseUrl;

function normalizeOllamaBaseUrl(baseUrl: string) {
  const trimmedBaseUrl = baseUrl.replace(/\/+$/, "");
  return trimmedBaseUrl.endsWith("/v1")
    ? trimmedBaseUrl
    : `${trimmedBaseUrl}/v1`;
}

export const aiProvider: AiProvider =
  rawProvider === "openai" ? "openai" : "ollama";

export const aiModel =
  aiProvider === "openai"
    ? process.env.OPENAI_MODEL?.trim() || "gpt-4o"
    : process.env.OLLAMA_MODEL?.trim() || "qwen2.5-coder:3b";

export const ollamaBaseUrl = normalizeOllamaBaseUrl(configuredOllamaBaseUrl);

export const openai =
  aiProvider === "openai"
    ? openAiApiKey
      ? new OpenAI({
          apiKey: openAiApiKey,
          baseURL: openAiBaseUrl || undefined,
        })
      : null
    : new OpenAI({
        apiKey: process.env.OLLAMA_API_KEY?.trim() || "ollama",
        baseURL: ollamaBaseUrl,
      });

function featureName(feature: AiFeature) {
  return feature === "chat" ? "Chat" : "Code analysis";
}

export function getAiUnavailableMessage(feature: AiFeature) {
  if (aiProvider === "openai") {
    return `OPENAI_API_KEY is not configured. Add it to your server environment before using ${featureName(
      feature,
    ).toLowerCase()}.`;
  }

  return `${featureName(
    feature,
  )} is configured for local Ollama, but Ollama is not ready yet. Start Ollama and pull the model with \`ollama pull ${aiModel}\`.`;
}

export function getAiErrorDetails(
  error: unknown,
  feature: AiFeature,
): {
  message: string;
  status: number;
} {
  if (error instanceof SyntaxError) {
    return {
      message: "Invalid request body.",
      status: 400,
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    if (aiProvider === "openai" && error.status === 429) {
      return {
        message:
          "CodeCoach could not reach OpenAI because the current API key has no available quota or billing is not enabled yet.",
        status: 429,
      };
    }

    if (aiProvider === "ollama" && error.status === 404) {
      return {
        message: `Ollama could not find the model "${aiModel}". Run \`ollama pull ${aiModel}\` and try again.`,
        status: 503,
      };
    }
  }

  if (aiProvider === "ollama") {
    return {
      message: `${featureName(
        feature,
      )} could not reach Ollama at ${configuredOllamaBaseUrl}. Start Ollama and pull the model with \`ollama pull ${aiModel}\`.`,
      status: 503,
    };
  }

  if (error instanceof Error) {
    return {
      message:
        error.message ||
        `${featureName(feature)} is unavailable right now.`,
      status: 500,
    };
  }

  return {
    message: `${featureName(feature)} is unavailable right now.`,
    status: 500,
  };
}
