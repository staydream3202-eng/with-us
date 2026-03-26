import AuthGuard from '@/components/auth/AuthGuard'
import BottomNav from '@/components/ui/BottomNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white">
        <main className="flex-1 overflow-y-auto pb-14">{children}</main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}
