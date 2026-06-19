"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MessageSquare, Send } from "lucide-react"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiCall } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

type User = { _id: string; id?: string; name?: string; email?: string; role: "super_admin" | "admin" | "manager" | "staff" }
type Conversation = { _id: string; participants: User[]; lastMessage?: string; lastMessageAt?: string; unreadCount?: number }
type Message = { _id: string; message: string; sender: User; createdAt: string; mentions?: string[] }

export default function ChatPage() {
  const { user, isLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [active, setActive] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [typingUser, setTypingUser] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const currentUserId = user?.id || user?._id || ""
  const activeOther = useMemo(
    () => active?.participants.find((participant) => participant._id !== currentUserId && participant.id !== currentUserId),
    [active, currentUserId],
  )

  const loadConversations = async () => {
    const response = await apiCall("/api/chat/conversations")
    if (response.ok) setConversations(await response.json())
  }

  const searchUsers = async () => {
    if (!search.trim()) {
      setUsers([])
      return
    }
    const response = await apiCall(`/api/chat/users?search=${encodeURIComponent(search)}`)
    if (response.ok) setUsers(await response.json())
  }

  const openConversation = async (conversation: Conversation) => {
    setActive(conversation)
    const response = await apiCall(`/api/chat/conversations/${conversation._id}/messages`)
    if (response.ok) setMessages(await response.json())
  }

  const startConversation = async (participantId: string) => {
    const response = await apiCall("/api/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ participantId }),
    })
    if (response.ok) {
      const conversation = await response.json()
      await loadConversations()
      await openConversation(conversation)
    }
  }

  const sendMessage = async () => {
    if (!active || !message.trim()) return
    const mentions = users
      .filter((item) => item.name && message.includes(`@${item.name}`))
      .map((item) => item._id)

    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", { conversationId: active._id, message: message.trim(), mentions })
      setMessage("")
      return
    }
    const response = await apiCall(`/api/chat/conversations/${active._id}/messages`, {
      method: "POST",
      body: JSON.stringify({ message: message.trim(), mentions }),
    })
    if (response.ok) setMessage("")
    await openConversation(active)
    await loadConversations()
  }

  useEffect(() => {
    if (!isLoading && user) {
      loadConversations()
    }
  }, [isLoading, user])

  useEffect(() => {
    if (!user) return
    const timer = setTimeout(searchUsers, 250)
    return () => clearTimeout(timer)
  }, [search, user])

  useEffect(() => {
    if (!user || typeof window === "undefined") return
    const token = localStorage.getItem("token")
    if (!token) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin
    const socket = io(apiUrl, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
    })
    socketRef.current = socket

    socket.on("connected", (payload: { userId: string; onlineUsers?: string[] }) => {
      setOnlineUsers(payload.onlineUsers || [])
    })

    socket.on("presence:update", (payload: { userId: string; online: boolean }) => {
      setOnlineUsers((current) => {
        const set = new Set(current)
        if (payload.online) set.add(payload.userId)
        else set.delete(payload.userId)
        return [...set]
      })
    })

    socket.on("message", (payload: { conversationId: string; message: Message }) => {
      if (payload.conversationId === active?._id) {
        setMessages((current) => current.some((item) => item._id === payload.message._id) ? current : [...current, payload.message])
      }
      loadConversations()
    })

    socket.on("typing", (payload: { conversationId: string; userId: string }) => {
      if (payload.userId !== currentUserId && payload.conversationId === active?._id) {
        setTypingUser("typing...")
        setTimeout(() => setTypingUser(""), 1200)
      }
    })

    let idleTimer: ReturnType<typeof setTimeout>
    const markActive = () => {
      socket.emit("presence:active")
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => socket.emit("presence:idle"), 5 * 60 * 1000)
    }
    const activityEvents = ["mousemove", "keydown", "pointerdown", "touchstart", "scroll"]
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }))
    markActive()

    return () => {
      clearTimeout(idleTimer)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActive))
      socket.disconnect()
    }
  }, [user, active?._id, currentUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const formatMessage = (text: string) =>
    text.split(/(@[\w\s.-]+)/g).map((part, index) =>
      part.startsWith("@") ? <span key={`${part}-${index}`} className="font-semibold text-cyan-300">{part}</span> : part,
    )

  if (isLoading || !user) return null

  return (
        <div className="grid h-full min-h-0 gap-4 overflow-hidden p-4 md:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="min-h-0 overflow-hidden">
            <CardHeader><CardTitle>Chat</CardTitle></CardHeader>
            <CardContent className="flex h-[calc(100%-4rem)] flex-col gap-4">
              <Input placeholder="Search allowed users" value={search} onChange={(event) => setSearch(event.target.value)} />
              <div className="space-y-2 overflow-auto">
                {users.map((item) => (
                  <button key={item._id} className="w-full rounded-md border px-3 py-2 text-left text-sm" onClick={() => startConversation(item._id)}>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.role}</div>
                  </button>
                ))}
                {search.trim() && !users.length && (
                  <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">No users found.</p>
                )}
              </div>
              <div className="border-t pt-3">
                <div className="mb-2 text-sm font-medium">Conversations</div>
                <div className="space-y-2 overflow-auto">
                  {conversations.map((conversation) => {
                    const other = conversation.participants.find((participant) => participant._id !== currentUserId && participant.id !== currentUserId)
                    return (
                      <button key={conversation._id} className="w-full rounded-md border px-3 py-2 text-left text-sm" onClick={() => openConversation(conversation)}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2 font-medium">
                            <span className={`h-2 w-2 rounded-full ${other && onlineUsers.includes(other._id) ? "bg-emerald-500" : "bg-slate-300"}`} />
                            {other?.name || "Conversation"}
                          </span>
                          {conversation.unreadCount ? <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[11px] font-semibold text-white">{conversation.unreadCount}</span> : null}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{conversation.lastMessage || "No messages yet"}</div>
                        {conversation.lastMessageAt && <div className="text-[11px] text-muted-foreground">{new Date(conversation.lastMessageAt).toLocaleTimeString()}</div>}
                      </button>
                    )
                  })}
                  {!conversations.length && (
                    <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">No chats yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-col overflow-hidden">
            <CardHeader>
              <CardTitle>{activeOther?.name || (active ? "Messages" : "Select a conversation")}</CardTitle>
              {activeOther && (
                <p className="text-sm text-muted-foreground capitalize">
                  {activeOther.role} - {onlineUsers.includes(activeOther._id) ? "online" : "offline"} {typingUser ? `- ${typingUser}` : ""}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
              {active ? (
                <div className="min-h-0 flex-1 space-y-3 overflow-auto rounded-md border p-3">
                  {messages.map((item) => {
                    const mine = item.sender?._id === currentUserId || item.sender?.id === currentUserId
                    return (
                      <div key={item._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <div>{formatMessage(item.message)}</div>
                          <div className="mt-1 text-[11px] opacity-70">{new Date(item.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    )
                  })}
                  {!messages.length && (
                    <div className="flex min-h-[260px] items-center justify-center text-center text-sm text-muted-foreground">
                      <div>
                        <MessageSquare className="mx-auto mb-3 h-8 w-8 text-cyan-600" />
                        <p className="font-medium text-foreground">No messages yet</p>
                        <p>Send the first message to start this chat.</p>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed bg-muted/20 p-8 text-center">
                  <div>
                    <MessageSquare className="mx-auto mb-3 h-10 w-10 text-cyan-600" />
                    <p className="font-medium">Select a conversation</p>
                    <p className="mt-1 text-sm text-muted-foreground">Choose an existing chat or search for a user to start a new one.</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value)
                    if (active && socketRef.current?.connected) {
                      socketRef.current.emit("typing", { conversationId: active._id })
                    }
                  }}
                  onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                  disabled={!active}
                  placeholder="Type message or @mention"
                />
                <Button onClick={sendMessage} disabled={!active || !message.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
  )
}
