import { openai } from "@ai-sdk/openai";
import { getEdgeRuntimeResponse } from "@assistant-ui/react/edge";

export const maxDuration = 30;

export const POST = async (request: Request) => {
  const apiKey = request.headers.get('abc123');
  if (!apiKey) return new Response("No API key provided", { status: 401 });
  const requestData = await request.json();

  return await getEdgeRuntimeResponse({
    options: {
      model: openai("gpt-4o"),
    },
    requestData,
    abortSignal: request.signal,
  })
}
