import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import { auth } from '@/lib/auth'
import DashboardNav from './DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard')
  }

  return (
    <main className="grid min-h-screen bg-zinc-950 text-zinc-100 lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-white/10 bg-black px-6 py-8 lg:border-b-0 lg:border-r">
        <div className="text-xl font-semibold tracking-tight">DealScout</div>
        <DashboardNav />
      </aside>
      <div className="flex min-h-screen flex-col">{children}</div>
      <Toaster theme="dark" position="bottom-right" richColors />
    </main>
  )
}
