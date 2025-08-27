import { createOpenAI, openai } from '@ai-sdk/openai';
import { Redis } from '@upstash/redis';
import { streamText, UIMessage, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, Tool, ToolSet, createIdGenerator, generateObject } from 'ai';
import z from 'zod'
import { gateway } from '@ai-sdk/gateway';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const openaiProvider = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE,
  apiKey: process.env.OPENAI_API_KEY,
});

export const PhraseEvent = z.object({
  phrase: z.string(),
  sentence: z.string(),
  phraseTranslation: z.string(),
  sentenceTranslation: z.string(),
})

export type MyUIMessage = UIMessage<
  {
    suggestion: boolean;
  }, // metadata type
  {
    phrases: z.infer<typeof PhraseEvent>[];
  } // data parts type
>;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')
  console.log('request chat id:', id)
  const messages = await redis.get<UIMessage[]>(`chat-${id}`) ?? [];
  console.log('messages', messages)
  return Response.json({ messages });
}

// const defaultModel = openaiProvider('gpt-4o')
// const defaultModel = gateway('openai/gpt-4o')
const defaultModel = 'openai/gpt-4o'

export async function POST(req: Request) {
  const { messages, id, webSearch }: { messages: MyUIMessage[], id: string, webSearch: boolean } = await req.json();

  const tools: ToolSet = {};

  if (webSearch) {
    tools.web_search_preview = openai.tools.webSearchPreview({});
  }

  // const previousMessages = await redis.get<UIMessage[]>(`chat-${id}`) ?? [];
  // const mergedMessages = [...previousMessages, ...messages];

  console.log('request messages:', messages)
  const userMessages = messages.filter(message => message.role === 'user')
  const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null
  const lastSuggestionMessage = lastUserMessage?.metadata?.suggestion ? lastUserMessage : null
  // @ts-ignore
  const lastSuggestion: string = lastSuggestionMessage?.parts[0].text

  const stream = createUIMessageStream<MyUIMessage>({
    originalMessages: messages,
    onError(error) {
      console.log('onError', error)
      return '请求失败'
    },
    async onFinish({ messages }) {
      console.log('onFinish', messages)
      await redis.set(`chat-${id}`, messages)
    },
    execute: async ({ writer }) => {
      console.log('time1:', Date.now());
      const result = streamText({
        model: defaultModel,
        messages: convertToModelMessages(messages),
        tools,
        onFinish() {
          // writer.write({
          //   type: 'data-notification',
          //   data: { message: 'Request completed', level: 'info' },
          //   // transient: true, // Won't be added to message history
          // });
        }
      });
      console.log('time2:', Date.now());

      if (lastSuggestionMessage) {
        try {
          console.log('start generateObject:', lastSuggestionMessage)
          const { object } = await generateObject({
            model: defaultModel,
            output: 'array',
            schema: PhraseEvent,
            system: `
              # Identity
              
              Extract all unique English phrase and the related sentence of phrase from the following question.
              Translate the extracted English phrases and sentences into Chinese.

            `,
            prompt: lastSuggestion,
          });
          console.log('generateObject:', object)
          writer.write({
            type: 'data-phrases',
            data: object,
          })
        } catch (error) {
          console.log('generateObject error:', error)
        }
      }

      const uiMessageStream = result.toUIMessageStream<MyUIMessage>({
        originalMessages: messages,
        generateMessageId: createIdGenerator({
          prefix: 'msg',
          size: 16,
        }),
        onFinish: async ({ messages }) => {
          // console.log('messages', messages);
        }
      });
      writer.merge(uiMessageStream);
    }
  })

  return createUIMessageStreamResponse({ stream });

  // const result = streamText({
  //   model: openaiProvider('gpt-4o'),
  //   messages: convertToModelMessages(messages),
  //   tools,
  // });

  // return result.toUIMessageStreamResponse({
  //   originalMessages: messages,
  //   generateMessageId: createIdGenerator({
  //     prefix: 'msg',
  //     size: 16,
  //   }),
  //   async onFinish({messages}) {
  //     console.log('messages', messages);
  //     await redis.set(`chat-${id}`, messages)
  //   }
  // });
}