"use client"

import { useEffect, useState } from "react"
import { MessageSquareReply } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiCall } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

type Feedback = {
  _id: string
  title: string
  message: string
  image?: string
  status: string
  createdAt: string
  createdBy?: { name?: string; role?: string }
  shop?: { name?: string }
  branchShop?: { name?: string }
  replies?: Array<{ _id: string; message: string; createdAt: string; createdBy?: { name?: string; role?: string } }>
}

const statuses = ["pending", "reviewed", "answered", "resolved", "rejected"]

export default function FeedbackPage() {
  const { user, isLoading } = useAuth()
  const [items, setItems] = useState<Feedback[]>([])
  const [form, setForm] = useState({ title: "", message: "", image: "" })
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState("all")
  const [isListLoading, setIsListLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = async () => {
    setIsListLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== "all") params.set("status", statusFilter)
    try {
      const response = await apiCall(`/api/feedback?${params.toString()}`)
      if (response.ok) setItems(await response.json())
    } finally {
      setIsListLoading(false)
    }
  }

  const submit = async () => {
    if (!form.title.trim() || !form.message.trim()) return
    setIsSubmitting(true)
    try {
      const response = await apiCall("/api/feedback", {
        method: "POST",
        body: JSON.stringify(form),
      })
      if (response.ok) {
        const created = await response.json()
        setForm({ title: "", message: "", image: "" })
        setItems((current) => (statusFilter === "all" || created.status === statusFilter ? [created, ...current] : current))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFeedback = async (id: string, status?: string) => {
    setUpdatingId(id)
    try {
      const response = await apiCall(`/api/feedback/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, reply: replyText[id] }),
      })
      if (response.ok) {
        const updated = await response.json()
        setReplyText((current) => ({ ...current, [id]: "" }))
        setItems((current) =>
          current
            .map((item) => (item._id === id ? updated : item))
            .filter((item) => statusFilter === "all" || item.status === statusFilter),
        )
      }
    } finally {
      setUpdatingId(null)
    }
  }

  useEffect(() => {
    if (!isLoading && user) load()
  }, [isLoading, user, statusFilter])

  if (isLoading || !user) return null

  const isSuperAdmin = user.role === "super_admin"

  return (
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold">Feedback</h1>
            <p className="mt-1 text-muted-foreground">{isSuperAdmin ? "Review and reply to user feedback." : "Submit feedback and track replies."}</p>
          </div>

          {!isSuperAdmin && (
            <Card>
              <CardHeader><CardTitle>Submit Feedback</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="Optional" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Message</Label>
                  <Textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} rows={4} />
                </div>
                <Button className="md:col-span-2" onClick={submit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="max-w-xs">
            <Label>Status Filter</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {isListLoading && <p className="text-sm text-muted-foreground">Loading feedback...</p>}
            {items.map((item) => (
              <Card key={item._id}>
                <CardHeader>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle>{item.title}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.createdBy?.name || "User"} {item.shop?.name ? `- ${item.shop.name}` : ""} {item.branchShop?.name ? `- ${item.branchShop.name}` : ""} - {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-md border px-3 py-1 text-sm capitalize">{item.status}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6">{item.message}</p>
                  {item.image && <img src={item.image} alt={item.title} className="max-h-64 rounded-md border object-contain" />}
                  {item.replies?.length ? (
                    <div className="space-y-2 border-t pt-3">
                      {item.replies.map((reply) => (
                        <div key={reply._id} className="rounded-md bg-muted p-3 text-sm">
                          <div>{reply.message}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{reply.createdBy?.name || "Support"} - {new Date(reply.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {isSuperAdmin && (
                    <div className="grid gap-3 border-t pt-3 md:grid-cols-[1fr_180px_auto]">
                      <Input placeholder="Reply" value={replyText[item._id] || ""} onChange={(event) => setReplyText({ ...replyText, [item._id]: event.target.value })} />
                      <Select value={item.status} onValueChange={(value) => updateFeedback(item._id, value)} disabled={updatingId === item._id}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button onClick={() => updateFeedback(item._id)} disabled={updatingId === item._id}>
                        <MessageSquareReply className="mr-2 h-4 w-4" />
                        {updatingId === item._id ? "Saving..." : "Reply"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
  )
}
