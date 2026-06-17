"use client"

import { useEffect, useState } from "react"
import { Building2, Mail, Phone, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiCall } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { PageLoading } from "@/components/page-loading"

type Branch = {
  _id: string
  name: string
  branchCode?: string
  address?: string
  phone?: string
  email?: string
  businessType?: string
  status: string
  manager?: { name?: string; email?: string; phone?: string }
}

type ManagerRequest = {
  _id: string
  status: string
  requestNote?: string
  requestedBy?: {
    _id: string
    name?: string
    email?: string
    phone?: string
    branchSetupStatus?: string
  }
  branchShop?: { name?: string; status?: string }
}

export default function BranchesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [requests, setRequests] = useState<ManagerRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [branchesRes, requestsRes] = await Promise.all([
        apiCall("/api/shops/branches"),
        apiCall("/api/auth/manager-requests"),
      ])
      if (branchesRes.ok) setBranches(await branchesRes.json())
      if (requestsRes.ok) setRequests(await requestsRes.json())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) loadData()
  }, [authLoading])

  const review = async (userId: string, action: "approve" | "reject") => {
    const url = action === "approve" ? `/api/auth/approve-user/${userId}` : `/api/auth/reject-user/${userId}`
    await apiCall(url, {
      method: "POST",
      body: action === "reject" ? JSON.stringify({ reason: "Rejected by admin" }) : undefined,
    })
    await loadData()
  }

  if (authLoading || isLoading) return <PageLoading compact />
  if (user?.role !== "admin") {
    return <div className="p-8 text-sm text-muted-foreground">Only shop admins can manage branches.</div>
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Branches</h1>
        <p className="mt-1 text-muted-foreground">Approve manager requests and view branch shops under your main business.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manager Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No manager requests found.</p>
          ) : (
            requests.map((request) => (
              <div key={request._id} className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4" />
                    {request.requestedBy?.name || "Manager"}
                    <Badge variant="outline" className="capitalize">{request.status}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {request.requestedBy?.email || request.requestedBy?.phone || "No contact"} {request.requestNote ? `- ${request.requestNote}` : ""}
                  </div>
                  {request.branchShop && (
                    <div className="mt-1 text-xs text-muted-foreground">Branch: {request.branchShop.name}</div>
                  )}
                </div>
                {request.status === "pending" && request.requestedBy?._id && (
                  <div className="flex gap-2">
                    <button className="rounded-md bg-foreground px-3 py-2 text-sm text-background" onClick={() => review(request.requestedBy!._id, "approve")}>
                      Approve
                    </button>
                    <button className="rounded-md border px-3 py-2 text-sm" onClick={() => review(request.requestedBy!._id, "reject")}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branch Shops</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch._id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <Building2 className="h-4 w-4" />
                      {branch.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{branch.businessType || "Branch"} {branch.branchCode ? `- ${branch.branchCode}` : ""}</div>
                  </TableCell>
                  <TableCell>{branch.manager?.name || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {branch.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{branch.phone}</span>}
                      {branch.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{branch.email}</span>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{branch.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {branches.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No branches setup yet.</div>}
        </CardContent>
      </Card>
    </div>
  )
}
