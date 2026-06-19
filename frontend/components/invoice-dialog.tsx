"use client"

import { useEffect, useMemo, useState } from "react"
import { Printer } from "lucide-react"
import { apiCall } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BrandLogo } from "@/components/brand-logo"

type InvoiceItem = {
  productName: string
  barcode?: string
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  subtotal: number
}

type InvoiceData = {
  invoiceNumber: string
  transactionId: string
  date: string
  cashier?: { name?: string; email?: string } | null
  customer?: { name?: string; phone?: string; email?: string }
  shop: {
    name: string
    logo?: string
    address?: string
    phone?: string
    email?: string
    currency?: string
  }
  items: InvoiceItem[]
  totals: {
    subtotal: number
    discount: number
    tax: number
    total: number
    paid: number
    due: number
    change: number
  }
  payment: {
    method: string
    distribution?: { cash?: number; bank?: number }
    status: string
  }
  notes?: string
}

type InvoiceDialogProps = {
  open: boolean
  saleId: string | null
  onOpenChange: (open: boolean) => void
}

const formatMoney = (value: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(Number(value || 0))
  } catch {
    return `${currency.toUpperCase()} ${Number(value || 0).toFixed(2)}`
  }
}

export function InvoiceDialog({ open, saleId, onOpenChange }: InvoiceDialogProps) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [previewScale, setPreviewScale] = useState(1)

  useEffect(() => {
    if (!open || !saleId) return

    const loadInvoice = async () => {
      setIsLoading(true)
      setError("")
      try {
        const response = await apiCall(`/api/sales/${saleId}/invoice`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || "Failed to load invoice")
        setInvoice(data.invoice)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoice")
        setInvoice(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoice()
  }, [open, saleId])

  const currency = invoice?.shop.currency || "USD"
  const paidLabel = useMemo(() => {
    if (!invoice) return ""
    const cash = Number(invoice.payment.distribution?.cash || 0)
    const bank = Number(invoice.payment.distribution?.bank || 0)
    return [`Cash ${formatMoney(cash, currency)}`, `Bank ${formatMoney(bank, currency)}`].join(" / ")
  }, [currency, invoice])

  useEffect(() => {
    if (!open || typeof window === "undefined") return

    const updateScale = () => {
      const a4Width = 794
      const maxWidth = Math.min(Math.max(320, window.innerWidth - 180), 660)
      setPreviewScale(Math.min(maxWidth / a4Width, 0.83))
    }

    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [open])

  const printInvoice = () => {
    const invoiceNode = document.getElementById("invoice-print-area")
    if (!invoiceNode || !invoice) return

    const iframe = document.createElement("iframe")
    iframe.setAttribute("title", " ")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    document.body.appendChild(iframe)

    const frameDocument = iframe.contentWindow?.document
    if (!frameDocument) {
      iframe.remove()
      return
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join("\n")

    frameDocument.open()
    frameDocument.write(`<!doctype html>
      <html>
        <head>
          <title> </title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 0; }
            html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body *,
            #invoice-print-area,
            #invoice-print-area * {
              visibility: visible !important;
            }
            #invoice-print-area {
              box-sizing: border-box !important;
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 auto !important;
              padding: 10mm !important;
              transform: none !important;
              background: white !important;
              border: 0 !important;
              border-radius: 0 !important;
              overflow: hidden !important;
              font-size: 10.5px !important;
            }
            #invoice-print-area * { box-sizing: border-box !important; }
            #invoice-print-area table {
              width: 100% !important;
              min-width: 0 !important;
              table-layout: fixed !important;
              font-size: 10.5px !important;
            }
            #invoice-print-area th,
            #invoice-print-area td {
              padding: 4px 5px !important;
              white-space: normal !important;
              overflow-wrap: anywhere !important;
            }
            #invoice-print-area .invoice-print-avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .invoice-no-print { display: none !important; }
          </style>
        </head>
        <body>${invoiceNode.outerHTML}</body>
      </html>`)
    frameDocument.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => iframe.remove(), 500)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-[calc(100vw-2rem)] max-w-[760px] overflow-hidden p-4 sm:max-w-[760px]">
        <DialogHeader className="invoice-no-print">
          {/* <DialogTitle>Printable Invoice</DialogTitle> */}
        </DialogHeader>

        <style jsx global>{`
          #invoice-print-area {
            width: 794px;
            min-height: 1123px;
            box-sizing: border-box;
            margin: 0 auto;
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            html,
            body {
              height: auto !important;
              overflow: visible !important;
              background: white !important;
            }
            body * {
              visibility: hidden;
            }
            [data-slot="dialog-overlay"] {
              display: none !important;
            }
            [data-slot="dialog-content"] {
              position: static !important;
              inset: auto !important;
              display: block !important;
              width: auto !important;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
              transform: none !important;
              border: 0 !important;
              box-shadow: none !important;
              padding: 0 !important;
              background: transparent !important;
            }
            #invoice-print-area,
            #invoice-print-area * {
              visibility: visible;
            }
            #invoice-print-area {
              position: static !important;
              box-sizing: border-box !important;
              width: 210mm !important;
              max-width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 auto !important;
              padding: 10mm !important;
              transform: none !important;
              background: white;
              border: 0 !important;
              border-radius: 0 !important;
              font-size: 10.5px !important;
            }
            #invoice-print-area table {
              width: 100% !important;
              min-width: 0 !important;
              table-layout: fixed !important;
            }
            #invoice-print-area th,
            #invoice-print-area td {
              padding: 4px 5px !important;
              white-space: normal !important;
              overflow-wrap: anywhere !important;
            }
            #invoice-print-area .invoice-print-avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .invoice-no-print {
              display: none !important;
            }
          }
        `}</style>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading invoice...</div>
        ) : error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
        ) : invoice ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="invoice-no-print flex justify-end mt-2">
              <Button onClick={printInvoice}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-md bg-slate-100/70 p-3">
              <div
                className="mx-auto shrink-0 overflow-hidden"
                style={{ width: 794 * previewScale, height: 1123 * previewScale }}
              >
                <section
                  id="invoice-print-area"
                  className="relative overflow-hidden rounded-md border bg-white p-8 text-slate-950"
                  style={{ transform: `scale(${previewScale})`, transformOrigin: "top left" }}
                >
                  <div className="pointer-events-none absolute left-[50%] top-[45%] -translate-x-1/2 -translate-y-1/2 text-left opacity-[0.055]">
                    <div className="mb-2 pl-4 text-xs font-semibold tracking-[0.24em] translate-y-1/1 text-cyan-950">Powered By,</div>
                    <BrandLogo variant="full" size="lg" className="h-32 w-[380px] border-0 bg-transparent shadow-none" />
                  </div>

              <div className="relative space-y-4 text-[11px]">
                <div className="invoice-print-avoid-break flex gap-4 border-b pb-4">
                  <div className="flex items-start gap-4">
                    {invoice.shop.logo ? (
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-cyan-950/10 bg-[#f8fbff] p-2">
                        <img src={invoice.shop.logo} alt={invoice.shop.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <BrandLogo variant="mark" size="md" />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold">{invoice.shop.name}</h2>
                      <div className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                        {invoice.shop.address && <p>{invoice.shop.address}</p>}
                        {invoice.shop.phone && <p>Phone: {invoice.shop.phone}</p>}
                        {invoice.shop.email && <p>Email: {invoice.shop.email}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto shrink-0 max-w-[280px] text-right text-[11px]">
                    <div className="text-xl font-semibold uppercase tracking-normal">Invoice</div>
                    <p>Invoice #: {invoice.invoiceNumber}</p>
                    <p>Transaction ID: {invoice.transactionId}</p>
                    <p>Date: {new Date(invoice.date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="invoice-print-avoid-break grid grid-cols-3 gap-3 text-[11px]">
                  <div className="rounded-md border p-2">
                    <p className="font-semibold">Cashier</p>
                    <p>{invoice.cashier?.name || "-"}</p>
                    {/* {invoice.cashier?.email && <p className="text-slate-600">{invoice.cashier.email}</p>} */}
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="font-semibold">Customer</p>
                    <p>{invoice.customer?.name || "Walk-in"}</p>
                    {invoice.customer?.phone && <p className="text-slate-600">{invoice.customer.phone}</p>}
                    {invoice.customer?.email && <p className="text-slate-600">{invoice.customer.email}</p>}
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="font-semibold">Payment</p>
                    <p className="capitalize">{invoice.payment.method} ({invoice.payment.status})</p>
                    <p className="text-slate-600">{paidLabel}</p>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <table className="w-full table-fixed border-collapse text-[10.5px]">
                    <thead>
                      <tr className="border-b bg-slate-50 text-left">
                        <th className="w-[36%] p-1.5">Product</th>
                        <th className="w-[8%] p-1.5">Qty</th>
                        <th className="w-[14%] p-1.5 text-right">Unit</th>
                        <th className="w-[14%] p-1.5 text-right">Discount</th>
                        <th className="w-[12%] p-1.5 text-right">Tax</th>
                        <th className="w-[16%] p-1.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={`${item.productName}-${index}`} className="border-b">
                          <td className="p-1.5">
                            <div className="font-medium">{item.productName}</div>
                            {item.barcode && <div className="text-xs text-slate-500">{item.barcode}</div>}
                          </td>
                          <td className="p-1.5">{item.quantity}</td>
                          <td className="p-1.5 text-right">{formatMoney(item.unitPrice, currency)}</td>
                          <td className="p-1.5 text-right">{formatMoney(item.discount, currency)}</td>
                          <td className="p-1.5 text-right">{formatMoney(item.tax, currency)}</td>
                          <td className="p-1.5 text-right font-medium">{formatMoney(item.subtotal, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="invoice-print-avoid-break ml-auto max-w-xs space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(invoice.totals.subtotal, currency)}</span></div>
                  <div className="flex justify-between"><span>Discount</span><span>{formatMoney(invoice.totals.discount, currency)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>{formatMoney(invoice.totals.tax, currency)}</span></div>
                  <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(invoice.totals.total, currency)}</span>
                  </div>
                  <div className="flex justify-between"><span>Paid</span><span>{formatMoney(invoice.totals.paid, currency)}</span></div>
                  <div className="flex justify-between"><span>Due</span><span>{formatMoney(invoice.totals.due, currency)}</span></div>
                  <div className="flex justify-between"><span>Change</span><span>{formatMoney(invoice.totals.change, currency)}</span></div>
                </div>

                {invoice.notes && (
                  <div className="rounded-md border p-2 text-[11px]">
                    <p className="font-semibold">Notes</p>
                    <p className="mt-1 text-slate-600">{invoice.notes}</p>
                  </div>
                )}
              </div>
                </section>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
