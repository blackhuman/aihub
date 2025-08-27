import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { ChatList } from '@/components/ai/ChatList'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
    const [chatIds, setChatIds] = useLocalStorage<string[]>('chat-ids', [])
    const navigate = useNavigate()

    const createChat = useCallback(() => {
      const chatId = uuidv4()
      setChatIds(chatIds => [...chatIds, chatId])
      navigate({
        to: '/chat/$chatId',
        params: {
            chatId: chatId
        }
      })
      return chatId
    }, [])

  return (
    <div className="p-2 flex flex-col gap-2">
      <ChatList />
    </div>
  )
}