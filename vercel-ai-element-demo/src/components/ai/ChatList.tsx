import { Link } from "@tanstack/react-router"
import { Button } from "../ui/button"
import { useChatList } from "./chat-list-state"


export function ChatList() {
    const { chats, newChat, updateTitle } = useChatList()
    return (
        <div className="flex flex-col gap-2">
            <ul>
                {chats.map((chat) => (
                    <li key={chat.id}>
                        <Link key={chat.id} to={`/chat/$chatId`} 
                            params={{ chatId: chat.id }}
                            className="[&.active]:font-bold">
                            {chat.title}
                        </Link>
                    </li>
                ))}
            </ul>
            <Button onClick={newChat}>New Chat</Button>
        </div>
    )
}