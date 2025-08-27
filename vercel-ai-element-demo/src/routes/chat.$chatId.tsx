import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { GlobeIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/source';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { createIdGenerator, DefaultChatTransport, type UIMessage } from 'ai';
import { createFileRoute } from '@tanstack/react-router';
import { Suggestion } from '@/components/ai-elements/suggestion';
import { Suggestions } from '@/components/ai-elements/suggestion';
import z from 'zod'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useChatList, useChatTitle } from '@/components/ai/chat-list-state';

const models = [
  {
    name: 'GPT-5',
    value: 'openai/gpt-5',
  },
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o',
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
  },
];

type LoaderData = {
  messages: UIMessage[]
}

export const Route = createFileRoute('/chat/$chatId')({
  component: ChatBotDemo,
  async loader(ctx) {
    const { chatId } = ctx.params
    const res = await fetch(`${baseUrl}/api/chat?id=${chatId}`, {
      method: 'GET',
    })
    const data: LoaderData = await res.json()
    console.log('loader data', data)
    return data
  },
})

// const baseUrl = 'http://localhost:3000'
const baseUrl = 'https://aihub-beta.vercel.app'

export const PhraseEvent = z.object({
  phrase: z.string(),
  sentence: z.string(),
  phraseTranslation: z.string(),
  sentenceTranslation: z.string(),
})

type PhraseEventType = z.infer<typeof PhraseEvent>

export type MyUIMessage = UIMessage<
  {
    suggestion: boolean;
  }, // metadata type
  {
    phrases: z.infer<typeof PhraseEvent>[];
  } // data parts type
>;

function PhraseCard(props: { phrases: PhraseEventType[] | undefined }) {
  const { phrases } = props
  if (!phrases) {
    return null
  }
  return (
    <Card>
      {phrases.map((phrase, i) => (
        <div key={i}>
        <CardHeader>
          <CardTitle className='flex gap-2'>
              <span>{phrase.phrase}</span>
              <span>{phrase.phraseTranslation}</span>
          </CardTitle>
          <CardDescription>
            <p>{phrase.sentence}</p>
            <p>{phrase.sentenceTranslation}</p>
          </CardDescription>
          <CardAction>Go To</CardAction>
        </CardHeader>
        </div>
      ))}
    </Card>
  )
}

function ChatBotDemo() {
  const { chatId } = Route.useParams()
  const suggestion = '词组trends在句子"What are the latest trends in AI?"中的含义是什么'
  const { updateTitle } = useChatList()
  const title = useChatTitle(chatId)

  // const [chatMessagesRemote, setChatMessagesRemote] = useState<UIMessage[]>([])
  // useEffect(() => {
  //   async function process() {
  //     const res = await fetch(`${baseUrl}/api/chat?id=${chatId}`, {
  //       method: 'GET',
  //     })
  //     const data = await res.json()
  //     setChatMessagesRemote(data.messages)
  //   }
  //   process()
  // }, [chatId])
  const { messages: chatMessagesRemote } = Route.useLoaderData()

  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status } = useChat<MyUIMessage>({
    id: chatId,
    messages: chatMessagesRemote as MyUIMessage[],
    generateId: createIdGenerator({
      prefix: 'msgc',
      size: 16,
    }),
    transport: new DefaultChatTransport({
      api: `${baseUrl}/api/chat`,
      // prepareSendMessagesRequest({messages, requestMetadata, body}) {
      //   console.log('prepareSendMessagesRequest', messages, requestMetadata)
      //   return {
      //     body: body!
      //   }
      // }
    }),
    onFinish({ message }) {
      // setChatMessages(messages)
    },
    onData: ({ data, type }) => {
      if (type === 'data-phrases') {
        console.log('phrases:', data)
      }
    },
  });
  useEffect(() => {
    if (status === 'ready') {
      console.log('ready', messages)
      const phrases = messages.flatMap(message => message.role === 'assistant' ? message.parts.filter(part => part.type === 'data-phrases') : [])
        .map(part => part.data[0] as PhraseEventType)
      const phrase = phrases[0]
      if (phrase) {
        updateTitle(chatId, phrase.phrase + ' ' + phrase.phraseTranslation)
      }
    }
  }, [messages, status])

  const handleSuggestionClick = (suggestion: string) => {
    console.log('handleSuggestionClick', suggestion)
    sendMessage({ text: suggestion, metadata: { suggestion: true } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(
        { text: input },
        {
          body: {
            model: model,
            webSearch: webSearch,
          },
        },
      );
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        {title}
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && (
                  <Sources>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'source-url':
                          return (
                            <>
                              <SourcesTrigger
                                count={
                                  message.parts.filter(
                                    (part) => part.type === 'source-url',
                                  ).length
                                }
                              />
                              <SourcesContent key={`${message.id}-${i}`}>
                                <Source
                                  key={`${message.id}-${i}`}
                                  href={part.url}
                                  title={part.url}
                                />
                              </SourcesContent>
                            </>
                          );
                      }
                    })}
                  </Sources>
                )}
                <PhraseCard phrases={message.parts.find(part => part.type === 'data-phrases')?.data} />
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <Response key={`${message.id}-${i}`}>
                              {part.text}
                            </Response>
                          );
                        case 'reasoning':
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="w-full"
                              isStreaming={status === 'streaming'}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              </div>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <Suggestions>
          <Suggestion onClick={handleSuggestionClick} suggestion={suggestion} />
        </Suggestions>  

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem key={model.value} value={model.value}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatBotDemo;