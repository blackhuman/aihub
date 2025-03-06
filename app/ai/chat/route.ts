import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";

export const maxDuration = 30;

export const POST = async (request: Request) => {
  const apiKey = request.headers.get('abc123');
  if (!apiKey) return new Response("No API key provided", { status: 401 });
  const { messages } = await request.json();

  return streamText({
    model: openai("gpt-4o"),
    messages: convertToCoreMessages(messages),
    abortSignal: request.signal,
  })
}
