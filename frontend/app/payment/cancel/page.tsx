import Link from "next/link"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <XCircle className="h-10 w-10 text-rose-600" />
          <CardTitle>Payment cancelled</CardTitle>
          <CardDescription>No shop access was created. You can choose a package again when ready.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" asChild>
            <Link href="/#pricing">Back to pricing</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
