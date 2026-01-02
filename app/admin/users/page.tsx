'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface User {
  _id: string
  name: string
  email: string
  role: string
  phone?: string
  approvalStatus: string
  createdAt: string
}

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'admin') {
      window.location.href = '/dashboard'
      return
    }

    fetchPendingUsers()
  }, [authLoading, user])

  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/pending-users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/approve-user/${userId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!response.ok) throw new Error('Failed to approve user')

      setUsers(users.filter(u => u._id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user')
    }
  }

  const handleReject = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reject-user/${userId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason }),
        },
      )

      if (!response.ok) throw new Error('Failed to reject user')

      setUsers(users.filter(u => u._id !== userId))
      setRejectDialogOpen(false)
      setSelectedUser(null)
      setRejectionReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject user')
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">Loading...</div>
    )
  }

  return (
    <div className="space-y-6 px-8 py-3">
      <div>
        <h1 className="text-3xl font-bold">User Approvals</h1>
        <p className="text-muted-foreground">
          Manage pending user registrations
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {users.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No pending users
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map(u => (
            <Card key={u._id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{u.name}</h3>
                      <Badge variant="outline">{u.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    {u.phone && (
                      <p className="text-sm text-muted-foreground">{u.phone}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Applied: {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => handleApprove(u._id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-2"
                      onClick={() => {
                        setSelectedUser(u)
                        setRejectDialogOpen(true)
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && handleReject(selectedUser._id)}
              disabled={!rejectionReason.trim()}
            >
              Reject User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
