import { RegistrationForm } from "@/components/registration-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, DollarSign } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-500/20"></div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <h1 className="text-5xl font-black text-white">
                TED<span className="text-red-500">x</span>ECU
              </h1>
            </div>
            <p className="text-xl text-slate-300 mb-2 font-medium">x = independently organized TED event</p>
            <p className="text-lg text-slate-400 italic">Ideas worth spreading</p>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Book Your Ticket</h2>
            <p className="text-xl text-slate-300 mb-2">
              Secure your spot at TEDxECU 2025 - Yin & Yang: Finding Balance in Innovation
            </p>
            <p className="text-lg text-red-400 font-semibold">June 20, 2025 • Egyptian Chinese University</p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">Date</h3>
                <p className="text-slate-300 text-sm">June 20, 2025</p>
                <p className="text-slate-400 text-xs">Friday, 9:00 AM - 6:00 PM</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">Venue</h3>
                <p className="text-slate-300 text-sm">Egyptian Chinese</p>
                <p className="text-slate-300 text-sm">University</p>
                <p className="text-slate-400 text-xs">Main Auditorium</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">Capacity</h3>
                <p className="text-slate-300 text-sm">500 Attendees</p>
                <p className="text-slate-400 text-xs">Limited Availability</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">Price</h3>
                <p className="text-slate-300 text-sm">399 EGP</p>
                <p className="text-slate-400 text-xs">Per person</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Registration Section */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-white font-bold">Purchase Your Ticket</CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Fill in your details below to proceed to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="mb-8 p-6 bg-slate-700/50 rounded-xl border border-slate-600">
                <h3 className="font-semibold mb-4 text-white text-lg">💳 Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-slate-300">
                      <strong className="text-red-400">Vodafone Cash:</strong> 01065823764
                    </p>
                    <p className="text-slate-300">
                      <strong className="text-red-400">Instapay:</strong> 01286627330
                    </p>
                  </div>
                  <div className="space-y-1 text-slate-400">
                    <p>• Payment is processed securely through Zirp</p>
                    <p>• You will be redirected to our payment provider</p>
                    <p>• Confirmation email will be sent after payment</p>
                    <p>• Bring a valid ID to the event</p>
                  </div>
                </div>
              </div>
              <RegistrationForm />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-center mb-4">
              <span className="text-white font-bold text-xl">TEDxECU</span>
            </div>
            <p className="text-slate-400 text-sm">
              TEDxECU is an independently organized TED event at the Egyptian Chinese University, bringing together
              inspiring speakers.
            </p>
            <p className="text-slate-500 text-xs mt-4">
              © 2025 TEDxECU. All rights reserved. | This independent TEDx event is operated under license from TED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
