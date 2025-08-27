import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import type {} from '@redux-devtools/extension' // required for devtools typing
import { createIdGenerator } from "ai"


interface ChatInfo {
    id: string
    title?: string
}

interface ChatListState {
  chats: ChatInfo[]
  newChat: () => void
  updateTitle: (id: string, title: string) => void
}

const useChatListStore = create<ChatListState>()(
  devtools(
    persist(
      (set) => ({
        chats: [],
        newChat: () => {
          set((state) => ({
            chats: [...state.chats, {
              id: createIdGenerator({
                prefix: 'chat',
                size: 16,
              })(),
            }],
          }))
        },
        updateTitle: (id: string, title: string) => {
          set((state) => ({
            chats: state.chats.map((chat) => {
              if (chat.id === id) {
                return {
                  ...chat,
                  title,
                }
              }
              return chat
            }),
          }))
        },
      }),
      {
        name: 'chat-list-storage',
        storage: createJSONStorage(() => {
          return {
            getItem(name) {
              return localStorage.getItem(name)
            },
            setItem(name, value) {
              localStorage.setItem(name, value)
            },
            removeItem(name) {
              localStorage.removeItem(name)
            },
          }
        }),
        version: 1,
      },
    ),
  ),
)

export function useChatList() {
    const {chats, newChat, updateTitle} = useChatListStore()
    return {
      chats: chats.map(chat => ({
        ...chat,
        title: chat.title ?? 'New Chat',
      })),
      newChat,
      updateTitle,
    }
}

export function useChatTitle(id: string) {
  return useChatListStore(store => store.chats.find(chat => chat.id === id)?.title ?? 'New Chat')
}