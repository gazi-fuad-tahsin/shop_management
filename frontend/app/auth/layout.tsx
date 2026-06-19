import type React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#061a3a_0%,#082550_52%,#0b365e_100%)] px-4 py-8">
      <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="hidden text-white lg:block">
          <div className="max-w-2xl">
            <div className="mb-8 h-px w-28 bg-cyan-300" />
            <h1 className="text-5xl font-semibold leading-tight">Vendastro shop operations, secured by branch.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-cyan-50/80">
              Inventory, POS, costs, reports, chat, and feedback in one tenant-aware workspace.
            </p>
          </div>
        </section>
        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}
