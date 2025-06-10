import { AdminDashboard } from "@/components/admin-dashboard"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <img src="/images/tedx-logo.png" alt="TEDx Logo" className="w-8 h-auto" />
              </div>
              <CardTitle className="text-3xl text-center text-white font-bold">
                TED<span className="text-red-500">x</span>ECU Admin Dashboard
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
        <AdminDashboard />
      </div>
    </div>
  )
}
